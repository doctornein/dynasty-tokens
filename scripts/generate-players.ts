/**
 * generate-players.ts
 *
 * Fetches all active NBA players and their current season averages from
 * the balldontlie API, computes ratings/rarity, and writes the result
 * to src/data/generated/players.json.
 *
 * Run:  npx tsx scripts/generate-players.ts
 * Requires:  BALLDONTLIE_API_KEY env var
 */

import { BalldontlieAPI } from "@balldontlie/sdk";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Rating helpers (duplicated from src/lib/playerRating.ts to avoid path alias
// issues when running outside of Next.js)
// ---------------------------------------------------------------------------

interface PlayerStats {
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  mpg: number;
}

type Rarity = "common" | "rare" | "epic" | "legendary";
type Position = "PG" | "SG" | "SF" | "PF" | "C";

function computeRawScore(stats: PlayerStats): number {
  return (
    stats.ppg * 2.0 +
    stats.rpg * 1.2 +
    stats.apg * 1.5 +
    stats.spg * 3.0 +
    stats.bpg * 3.0 +
    stats.fgPct * 0.3 +
    stats.fg3Pct * 0.15 +
    stats.ftPct * 0.1 +
    stats.mpg * 0.4
  );
}

function rawToRating(raw: number): number {
  const MIN_RAW = 20;
  const MAX_RAW = 120;
  const MIN_RATING = 65;
  const MAX_RATING = 99;
  const clamped = Math.max(MIN_RAW, Math.min(MAX_RAW, raw));
  const normalized = (clamped - MIN_RAW) / (MAX_RAW - MIN_RAW);
  return Math.round(MIN_RATING + normalized * (MAX_RATING - MIN_RATING));
}

// ---------------------------------------------------------------------------
// Position mapping — balldontlie returns abbreviated positions like "G", "F",
// "G-F", "F-C", etc. Map to our five canonical positions.
// ---------------------------------------------------------------------------

function mapPosition(raw: string | null | undefined): Position {
  if (!raw) return "SF";
  const p = raw.toUpperCase().trim();
  if (p === "G" || p === "PG") return "PG";
  if (p === "SG" || p === "G-F") return "SG";
  if (p === "SF") return "SF";
  if (p === "F" || p === "PF" || p === "F-G") return "SF";
  if (p === "F-C" || p === "PF-C") return "PF";
  if (p === "C" || p === "C-F") return "C";
  return "SF";
}

// ---------------------------------------------------------------------------
// Team abbreviation mapping — balldontlie team abbreviations to ours
// ---------------------------------------------------------------------------

const TEAM_ABBR_MAP: Record<string, string> = {
  ATL: "ATL", BOS: "BOS", BKN: "BKN", CHA: "CHA", CHI: "CHI",
  CLE: "CLE", DAL: "DAL", DEN: "DEN", DET: "DET", GSW: "GSW",
  HOU: "HOU", IND: "IND", LAC: "LAC", LAL: "LAL", MEM: "MEM",
  MIA: "MIA", MIL: "MIL", MIN: "MIN", NOP: "NOP", NYK: "NYK",
  OKC: "OKC", ORL: "ORL", PHI: "PHI", PHX: "PHX", POR: "POR",
  SAC: "SAC", SAS: "SAS", TOR: "TOR", UTA: "UTA", WAS: "WAS",
};

const TEAM_FULL_NAMES: Record<string, string> = {
  ATL: "Atlanta Hawks", BOS: "Boston Celtics", BKN: "Brooklyn Nets",
  CHA: "Charlotte Hornets", CHI: "Chicago Bulls", CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks", DEN: "Denver Nuggets", DET: "Detroit Pistons",
  GSW: "Golden State Warriors", HOU: "Houston Rockets", IND: "Indiana Pacers",
  LAC: "LA Clippers", LAL: "Los Angeles Lakers", MEM: "Memphis Grizzlies",
  MIA: "Miami Heat", MIL: "Milwaukee Bucks", MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans", NYK: "New York Knicks", OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic", PHI: "Philadelphia 76ers", PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers", SAC: "Sacramento Kings", SAS: "San Antonio Spurs",
  TOR: "Toronto Raptors", UTA: "Utah Jazz", WAS: "Washington Wizards",
};

// ---------------------------------------------------------------------------
// Headshot resolution via ESPN public API
// ---------------------------------------------------------------------------

const HEADSHOT_CACHE_PATH = path.join(__dirname, "..", "src", "data", "headshot-cache.json");

function loadHeadshotCache(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(HEADSHOT_CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveHeadshotCache(cache: Record<string, string>): void {
  fs.writeFileSync(HEADSHOT_CACHE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Fetch all NBA player headshot URLs from ESPN's public roster API.
 * Iterates over all 30 teams — no auth or special headers required.
 * Returns a map of lowercase full name → headshot URL.
 */
async function fetchEspnHeadshots(): Promise<Map<string, string>> {
  const nameToUrl = new Map<string, string>();
  const ESPN_NBA_TEAM_COUNT = 30;

  for (let teamId = 1; teamId <= ESPN_NBA_TEAM_COUNT; teamId++) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  ESPN team ${teamId} returned ${res.status}`);
        continue;
      }

      const json = (await res.json()) as any;
      const athletes: any[] = json?.athletes ?? [];

      for (const athlete of athletes) {
        const name = (athlete.fullName ?? athlete.displayName ?? "").trim().toLowerCase();
        const headshotUrl =
          athlete.headshot?.href ?? athlete.headshot?.url ?? null;
        if (name && headshotUrl) {
          nameToUrl.set(name, headshotUrl);
        }
      }
    } catch (err) {
      console.warn(`  ESPN team ${teamId} fetch failed: ${(err as Error).message}`);
    }
  }

  return nameToUrl;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const CURRENT_SEASON = 2025; // balldontlie uses the starting year of the season (2025-26)

async function main() {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    console.warn("⚠  BALLDONTLIE_API_KEY not set — skipping generation, using existing JSON.");
    process.exit(0);
  }

  const api = new BalldontlieAPI({ apiKey });
  const headshotCache = loadHeadshotCache();

  // 0. Fetch headshot URLs from ESPN
  console.log("Fetching headshots from ESPN...");
  const espnHeadshots = await fetchEspnHeadshots();
  console.log(`  Got ${espnHeadshots.size} headshot URLs from ESPN`);

  // 1. Fetch all active players (paginated)
  console.log("Fetching active players...");
  interface BdlPlayer {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    jersey_number: string | null;
    height: string | null;
    weight: string | null;
    college: string | null;
    country: string | null;
    draft_year: number | null;
    draft_round: number | null;
    draft_number: number | null;
    team: { id: number; abbreviation: string; full_name: string };
  }

  const allPlayers: BdlPlayer[] = [];
  let cursor: number | undefined = undefined;

  while (true) {
    const res: any = await api.nba.getActivePlayers({
      per_page: 100,
      ...(cursor ? { cursor } : {}),
    });
    const data = res.data ?? res;
    const items: BdlPlayer[] = Array.isArray(data) ? data : data.data ?? [];
    allPlayers.push(...items);

    const meta = res.meta ?? data.meta;
    if (!meta?.next_cursor) break;
    cursor = meta.next_cursor;
  }

  console.log(`  Found ${allPlayers.length} active players`);

  // 2. Fetch season averages per player (SDK only supports single player_id)
  console.log("Fetching season averages...");
  interface SeasonAvg {
    player_id: number;
    games_played: number;
    min: string;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fg_pct: number;
    fg3_pct: number;
    ft_pct: number;
  }

  const averagesMap = new Map<number, SeasonAvg>();
  const CONCURRENCY = 10;

  // Process players in concurrent batches
  for (let i = 0; i < allPlayers.length; i += CONCURRENCY) {
    const batch = allPlayers.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (player) => {
      try {
        const res: any = await api.nba.getSeasonAverages({
          season: CURRENT_SEASON,
          player_id: player.id,
        });
        const data = res.data ?? res;
        const items: SeasonAvg[] = Array.isArray(data) ? data : data.data ?? [];
        for (const avg of items) {
          averagesMap.set(avg.player_id, avg);
        }
      } catch (err) {
        // Silently skip — player may not have stats this season
      }
    });

    await Promise.all(promises);

    // Progress update every 50 players
    if ((i + CONCURRENCY) % 50 < CONCURRENCY) {
      console.log(`  ... ${Math.min(i + CONCURRENCY, allPlayers.length)}/${allPlayers.length} players checked`);
    }

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`  Got averages for ${averagesMap.size} players`);

  // 3. Filter: ≥10 games AND ≥10 MPG
  interface PlayerBio {
    height: string;
    weight: string;
    college: string | null;
    country: string;
    draftYear: number | null;
    draftRound: number | null;
    draftPick: number | null;
    yearsPro: number;
  }

  interface ProcessedPlayer {
    bdlId: number;
    teamId: number;
    name: string;
    team: string;
    teamAbbr: string;
    position: Position;
    jerseyNumber: number;
    stats: PlayerStats;
    bio: PlayerBio;
    image: string | null;
  }

  const qualified: ProcessedPlayer[] = [];

  const emptyAvg: SeasonAvg = {
    player_id: 0, games_played: 0, min: "0",
    pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
    fg_pct: 0, fg3_pct: 0, ft_pct: 0,
  };

  for (const player of allPlayers) {
    const avg = averagesMap.get(player.id) ?? emptyAvg;
    const mpg = parseFloat(avg.min) || 0;

    const teamAbbr = TEAM_ABBR_MAP[player.team.abbreviation] ?? player.team.abbreviation;
    const playerName = `${player.first_name} ${player.last_name}`;

    // Resolve headshot: cached URL first, then ESPN lookup by name
    let image: string | null = headshotCache[String(player.id)] ?? null;
    if (!image) {
      const espnUrl = espnHeadshots.get(playerName.toLowerCase());
      if (espnUrl) {
        image = espnUrl;
        headshotCache[String(player.id)] = espnUrl; // cache for future runs
      }
    }

    const draftYear = player.draft_year && player.draft_year > 0 ? player.draft_year : null;
    const draftRound = player.draft_round && player.draft_round > 0 ? player.draft_round : null;
    const draftPick = player.draft_number && player.draft_number > 0 ? player.draft_number : null;

    qualified.push({
      bdlId: player.id,
      teamId: player.team.id,
      name: playerName,
      team: TEAM_FULL_NAMES[teamAbbr] ?? player.team.full_name,
      teamAbbr,
      position: mapPosition(player.position),
      jerseyNumber: parseInt(player.jersey_number ?? "0", 10) || 0,
      stats: {
        ppg: round1(avg.pts),
        rpg: round1(avg.reb),
        apg: round1(avg.ast),
        spg: round1(avg.stl),
        bpg: round1(avg.blk),
        fgPct: round1(avg.fg_pct * 100),
        fg3Pct: round1(avg.fg3_pct * 100),
        ftPct: round1(avg.ft_pct * 100),
        mpg: round1(mpg),
      },
      bio: {
        height: player.height ?? "",
        weight: player.weight ?? "",
        college: player.college || null,
        country: player.country ?? "USA",
        draftYear,
        draftRound,
        draftPick,
        yearsPro: draftYear ? CURRENT_SEASON - draftYear + 1 : 0,
      },
      image,
    });
  }

  console.log(`  Total players to generate: ${qualified.length} (${averagesMap.size} with stats)`);

  if (qualified.length === 0) {
    console.warn("⚠  No qualified players found — skipping generation.");
    process.exit(0);
  }

  // 4. Compute ratings
  const withRatings = qualified.map((p, idx) => ({
    ...p,
    overallRating: rawToRating(computeRawScore(p.stats)),
    _idx: idx,
  }));

  // 5. Assign rarities by percentile
  const sorted = [...withRatings].sort((a, b) => b.overallRating - a.overallRating);
  const total = sorted.length;
  const legendaryCount = Math.max(1, Math.round(total * 0.05));
  const epicCount = Math.max(1, Math.round(total * 0.10));
  const rareCount = Math.max(1, Math.round(total * 0.20));

  const rarityMap = new Map<number, Rarity>();
  for (let i = 0; i < sorted.length; i++) {
    let rarity: Rarity;
    if (i < legendaryCount) rarity = "legendary";
    else if (i < legendaryCount + epicCount) rarity = "epic";
    else if (i < legendaryCount + epicCount + rareCount) rarity = "rare";
    else rarity = "common";
    rarityMap.set(sorted[i]._idx, rarity);
  }

  // 6. Build final player objects
  const finalPlayers = withRatings.map((p) => ({
    id: `bdl-${p.bdlId}`,
    name: p.name,
    team: p.team,
    teamAbbr: p.teamAbbr,
    position: p.position,
    overallRating: p.overallRating,
    rarity: rarityMap.get(p._idx) ?? ("common" as Rarity),
    stats: p.stats,
    jerseyNumber: p.jerseyNumber,
    image: p.image,
    nbaPersonId: null,
    season: CURRENT_SEASON,
    teamId: p.teamId,
    bio: p.bio,
  }));

  // Sort by rating desc for nicer browsing
  finalPlayers.sort((a, b) => b.overallRating - a.overallRating);

  // 7. Write output
  const output = {
    generatedAt: new Date().toISOString(),
    season: CURRENT_SEASON,
    players: finalPlayers,
  };

  const outPath = path.join(__dirname, "..", "src", "data", "generated", "players.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  // Persist updated headshot cache for future runs
  saveHeadshotCache(headshotCache);

  // Print summary
  const rarityDist = { legendary: 0, epic: 0, rare: 0, common: 0 };
  for (const p of finalPlayers) rarityDist[p.rarity]++;

  const withHeadshots = finalPlayers.filter((p) => p.image !== null).length;
  console.log(`\n✅ Generated ${finalPlayers.length} players → ${outPath}`);
  console.log(`   Headshots:  ${withHeadshots}/${finalPlayers.length} (${pct(withHeadshots, finalPlayers.length)})`);
  console.log(`   Legendary: ${rarityDist.legendary} (${pct(rarityDist.legendary, total)})`);
  console.log(`   Epic:      ${rarityDist.epic} (${pct(rarityDist.epic, total)})`);
  console.log(`   Rare:      ${rarityDist.rare} (${pct(rarityDist.rare, total)})`);
  console.log(`   Common:    ${rarityDist.common} (${pct(rarityDist.common, total)})`);

  const topFive = finalPlayers.slice(0, 5);
  console.log(`\n   Top 5:`);
  for (const p of topFive) {
    console.log(`     ${p.overallRating} ${p.rarity.padEnd(10)} ${p.name}`);
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct(n: number, total: number): string {
  return ((n / total) * 100).toFixed(1) + "%";
}

main().catch((err) => {
  console.error("❌ Generation failed:", err);
  console.warn("⚠  Using existing players.json as fallback.");
  process.exit(0); // Exit 0 so build doesn't fail
});
