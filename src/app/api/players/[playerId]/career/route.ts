import { NextResponse } from "next/server";
import type { CareerSeasonEntry } from "@/types";

// ESPN career stats indices (from the "averages" category labels)
// ["GP","GS","MIN","FG","FG%","3PT","3P%","FT","FT%","OREB","DREB","REB","AST","BLK","STL","PF","TO","PTS"]
const IDX = {
  GP: 0, GS: 1, MIN: 2, FG: 3, FG_PCT: 4, TPT: 5, TPT_PCT: 6,
  FT: 7, FT_PCT: 8, OREB: 9, DREB: 10, REB: 11, AST: 12,
  BLK: 13, STL: 14, PF: 15, TO: 16, PTS: 17,
} as const;

interface EspnSeasonStats {
  season: { year: number; displayName: string };
  stats: string[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}/stats`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "ESPN API returned " + res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const categories: { name: string; displayName: string; statistics: EspnSeasonStats[] }[] =
      data.categories ?? [];

    // Find the "averages" category (Regular Season Averages)
    const avgCat = categories.find(
      (c) =>
        c.displayName?.toLowerCase().includes("average") ||
        c.name?.toLowerCase().includes("average")
    );

    if (!avgCat?.statistics?.length) {
      return NextResponse.json([]);
    }

    const entries: CareerSeasonEntry[] = avgCat.statistics
      .filter((s) => s.stats && s.season)
      .map((s) => ({
        season: s.season.year - 1, // ESPN uses end year (2025 = 2024-25), we use start year
        gamesPlayed: parseInt(s.stats[IDX.GP]) || 0,
        mpg: parseFloat(s.stats[IDX.MIN]) || 0,
        ppg: parseFloat(s.stats[IDX.PTS]) || 0,
        rpg: parseFloat(s.stats[IDX.REB]) || 0,
        apg: parseFloat(s.stats[IDX.AST]) || 0,
        spg: parseFloat(s.stats[IDX.STL]) || 0,
        bpg: parseFloat(s.stats[IDX.BLK]) || 0,
        fgPct: parseFloat(s.stats[IDX.FG_PCT]) || 0,
        fg3Pct: parseFloat(s.stats[IDX.TPT_PCT]) || 0,
        ftPct: parseFloat(s.stats[IDX.FT_PCT]) || 0,
        topg: parseFloat(s.stats[IDX.TO]) || 0,
      }));

    entries.sort((a, b) => a.season - b.season);

    return NextResponse.json(entries, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    console.error("Career stats fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch career stats" },
      { status: 502 }
    );
  }
}
