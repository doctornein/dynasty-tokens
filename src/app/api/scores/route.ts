import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date"); // YYYYMMDD
  const url = new URL(
    "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
  );
  if (date) url.searchParams.set("dates", date);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 30 } });
    if (!res.ok) {
      return NextResponse.json({ events: [] });
    }

    const data = await res.json();

    const events = (data.events ?? []).map((ev: Record<string, unknown>) => {
      const comp = (ev.competitions as Record<string, unknown>[])?.[0] ?? {};
      const status = ev.status as Record<string, unknown>;
      const statusType = status?.type as Record<string, unknown>;
      const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];

      const teams = competitors.map((c) => {
        const team = c.team as Record<string, unknown>;
        const stats = (c.statistics as Record<string, unknown>[]) ?? [];
        const leaders = (c.leaders as Record<string, unknown>[]) ?? [];
        const topScorer = leaders.find(
          (l) => (l as Record<string, unknown>).abbreviation === "PTS"
        );
        const topScorerLeader = (
          (topScorer as Record<string, unknown>)?.leaders as Record<
            string,
            unknown
          >[]
        )?.[0];

        return {
          id: team?.id,
          abbreviation: team?.abbreviation,
          displayName: team?.displayName,
          shortDisplayName: team?.shortDisplayName,
          logo: team?.logo,
          score: c.score,
          homeAway: c.homeAway,
          winner: c.winner,
          records: (c.records as Record<string, unknown>[])?.map(
            (r) => r.summary
          ),
          stats: stats.length > 0 ? stats : undefined,
          topScorer: topScorerLeader
            ? {
                name: (
                  topScorerLeader.athlete as Record<string, unknown>
                )?.shortName,
                value: topScorerLeader.displayValue,
              }
            : undefined,
        };
      });

      return {
        id: ev.id,
        date: ev.date,
        name: ev.name,
        shortName: ev.shortName,
        state: statusType?.state, // "pre", "in", "post"
        detail: statusType?.shortDetail, // "Final", "Q2 5:30", "7:30 PM ET"
        period: (status?.period as number) ?? 0,
        clock: status?.displayClock,
        teams,
      };
    });

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
