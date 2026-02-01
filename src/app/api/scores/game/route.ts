import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      return NextResponse.json({ game: null });
    }

    const data = await res.json();
    const header = data.header ?? {};
    const competition =
      ((header.competitions as Record<string, unknown>[]) ?? [])[0] ?? {};
    const status = competition.status as Record<string, unknown>;
    const statusType = (status?.type as Record<string, unknown>) ?? {};
    const competitors =
      (competition.competitors as Record<string, unknown>[]) ?? [];

    if (competitors.length === 0) {
      return NextResponse.json({ game: null });
    }

    const teams = competitors.map((c) => {
      const team = c.team as Record<string, unknown>;
      return {
        id: team?.id,
        abbreviation: team?.abbreviation,
        displayName: team?.displayName,
        shortDisplayName: team?.shortDisplayName,
        logo: team?.logo,
        score: c.score,
        homeAway: c.homeAway,
        winner: c.winner ?? false,
        records: ((c.records as Record<string, unknown>[]) ?? []).map(
          (r) => r.summary
        ),
      };
    });

    return NextResponse.json({
      game: {
        id: eventId,
        date: header.gameDate ?? competition.date,
        name: ((data.gameInfo as Record<string, unknown>)?.venue as Record<string, unknown>)?.fullName ?? "",
        shortName: `${teams[0]?.abbreviation ?? ""} @ ${teams[1]?.abbreviation ?? ""}`,
        state: statusType.state ?? "post",
        detail: statusType.shortDetail ?? "Final",
        period: (status?.period as number) ?? 0,
        clock: status?.displayClock ?? "0:00",
        teams,
      },
    });
  } catch {
    return NextResponse.json({ game: null });
  }
}
