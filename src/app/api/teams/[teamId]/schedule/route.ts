import { NextResponse } from "next/server";
import type { ScheduleEntry } from "@/types";

// Map team abbreviations to ESPN numeric team IDs
const ESPN_TEAM_IDS: Record<string, number> = {
  ATL: 1, BOS: 2, NOP: 3, CHI: 4, CLE: 5, DAL: 6, DEN: 7, DET: 8,
  GSW: 9, HOU: 10, IND: 11, LAC: 12, LAL: 13, MIA: 14, MIL: 15,
  MIN: 16, BKN: 17, NYK: 18, ORL: 19, PHI: 20, PHX: 21, POR: 22,
  SAC: 23, SAS: 24, OKC: 25, UTA: 26, WAS: 27, TOR: 28, MEM: 29,
  CHA: 30,
};

interface EspnCompetitor {
  homeAway: "home" | "away";
  team: { displayName: string; abbreviation: string };
  score?: { displayValue: string };
  winner?: boolean;
}

interface EspnEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: {
    competitors: EspnCompetitor[];
    status: { type: { description: string } };
    startDate: string;
  }[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId: teamAbbr } = await params;
  const espnTeamId = ESPN_TEAM_IDS[teamAbbr.toUpperCase()];

  if (!espnTeamId) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnTeamId}/schedule`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "ESPN API returned " + res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const events: EspnEvent[] = data.events ?? [];
    const now = new Date();

    const entries: ScheduleEntry[] = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const status = comp.status?.type?.description ?? "";
      if (status === "Final" || status === "Canceled") continue;

      const eventDate = new Date(event.date);
      if (eventDate < now && status !== "In Progress") continue;

      const us = comp.competitors.find(
        (c) => c.team.abbreviation.toUpperCase() === teamAbbr.toUpperCase()
      );
      const them = comp.competitors.find(
        (c) => c.team.abbreviation.toUpperCase() !== teamAbbr.toUpperCase()
      );

      if (!us || !them) continue;

      const isHome = us.homeAway === "home";
      const time = eventDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });

      entries.push({
        gameId: parseInt(event.id) || 0,
        date: event.date,
        time: status === "In Progress" ? "Live" : time,
        opponent: them.team.displayName,
        opponentAbbr: them.team.abbreviation,
        isHome,
        status: status || "Scheduled",
      });
    }

    entries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json(entries.slice(0, 10), {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Schedule fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 502 }
    );
  }
}
