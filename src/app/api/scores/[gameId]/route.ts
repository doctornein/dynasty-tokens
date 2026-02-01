import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) {
      return NextResponse.json({ boxscore: null }, { status: 200 });
    }

    const data = await res.json();
    const boxPlayers = data.boxscore?.players ?? [];

    const teams = boxPlayers.map(
      (teamData: Record<string, unknown>) => {
        const team = teamData.team as Record<string, unknown>;
        const statGroups = (teamData.statistics as Record<string, unknown>[]) ?? [];
        const mainStats = statGroups[0] ?? {};
        const labels = (mainStats as Record<string, unknown>).labels as string[] ?? [];
        const athletes =
          ((mainStats as Record<string, unknown>).athletes as Record<string, unknown>[]) ?? [];

        const players = athletes.map((a) => {
          const athlete = a.athlete as Record<string, unknown>;
          const stats = (a.stats as string[]) ?? [];
          const statMap: Record<string, string> = {};
          labels.forEach((label: string, i: number) => {
            statMap[label] = stats[i] ?? "";
          });

          return {
            id: athlete?.id,
            name: athlete?.displayName,
            shortName: athlete?.shortName,
            jersey: athlete?.jersey,
            position: (athlete?.position as Record<string, unknown>)
              ?.abbreviation,
            starter: a.starter,
            stats: statMap,
            didNotPlay: (a.didNotPlay as boolean) ?? false,
            reason: a.reason ?? null,
          };
        });

        return {
          id: team?.id,
          abbreviation: team?.abbreviation,
          displayName: team?.displayName,
          shortDisplayName: team?.shortDisplayName,
          logo: team?.logo,
          players,
        };
      }
    );

    // Game info
    const header = data.header ?? {};
    const competition =
      ((header.competitions as Record<string, unknown>[]) ?? [])[0] ?? {};
    const status = competition.status as Record<string, unknown>;
    const statusType = (status?.type as Record<string, unknown>) ?? {};

    // Line score (quarter-by-quarter)
    const competitors =
      (competition.competitors as Record<string, unknown>[]) ?? [];
    const lineScores = competitors.map((c) => {
      const team = c.team as Record<string, unknown>;
      return {
        abbreviation: team?.abbreviation,
        homeAway: c.homeAway,
        score: c.score,
        linescores: ((c.linescores as Record<string, unknown>[]) ?? []).map(
          (q) => q.displayValue
        ),
      };
    });

    return NextResponse.json({
      state: statusType.state,
      detail: statusType.shortDetail,
      teams,
      lineScores,
    });
  } catch {
    return NextResponse.json({ boxscore: null }, { status: 200 });
  }
}
