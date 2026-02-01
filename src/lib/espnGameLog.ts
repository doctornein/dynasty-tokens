import type { GameLogEntry } from "@/types";

// ESPN gamelog stat indices (matches their labels array)
// ["MIN","FG","FG%","3PT","3P%","FT","FT%","REB","AST","BLK","STL","PF","TO","PTS"]
const IDX = {
  MIN: 0, FG: 1, FG_PCT: 2, TPT: 3, TPT_PCT: 4,
  FT: 5, FT_PCT: 6, REB: 7, AST: 8, BLK: 9,
  STL: 10, PF: 11, TO: 12, PTS: 13,
} as const;

interface EspnEvent {
  atVs: string;
  gameDate: string;
  score: string;
  gameResult: string;
  homeTeamScore: string;
  awayTeamScore: string;
  opponent: { displayName: string; abbreviation: string };
  team: { abbreviation: string };
}

interface EspnGameStats {
  eventId: string;
  stats: string[];
}

export async function fetchEspnGameLog(espnId: string): Promise<GameLogEntry[]> {
  const res = await fetch(
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${espnId}/gamelog`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`ESPN API returned ${res.status}`);
  }

  const data = await res.json();
  const events: Record<string, EspnEvent> = data.events ?? {};

  const regSeason = data.seasonTypes?.["0"];
  if (!regSeason?.categories) {
    return [];
  }

  const statsMap = new Map<string, string[]>();
  for (const cat of regSeason.categories) {
    const catEvents: Record<string, EspnGameStats> = cat.events ?? {};
    for (const entry of Object.values(catEvents)) {
      statsMap.set(entry.eventId, entry.stats);
    }
  }

  const entries: GameLogEntry[] = [];
  for (const [eventId, stats] of statsMap) {
    const meta = events[eventId];
    if (!meta) continue;

    const isHome = meta.atVs === "vs";
    entries.push({
      date: meta.gameDate,
      opponent: meta.opponent.displayName,
      opponentAbbr: meta.opponent.abbreviation,
      isHome,
      min: stats[IDX.MIN] ?? "0",
      pts: parseInt(stats[IDX.PTS]) || 0,
      reb: parseInt(stats[IDX.REB]) || 0,
      ast: parseInt(stats[IDX.AST]) || 0,
      stl: parseInt(stats[IDX.STL]) || 0,
      blk: parseInt(stats[IDX.BLK]) || 0,
      fgPct: parseFloat(stats[IDX.FG_PCT]) || 0,
      fg3Pct: parseFloat(stats[IDX.TPT_PCT]) || 0,
      turnover: parseInt(stats[IDX.TO]) || 0,
      result: `${meta.gameResult} ${meta.score}`,
    });
  }

  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return entries;
}
