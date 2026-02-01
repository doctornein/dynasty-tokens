/**
 * Fetch all completed game dates for a team from the ESPN schedule API.
 * Unlike the existing /api/teams/[teamId]/schedule route, this includes
 * games with "Final" status — needed for arena settlement DNP detection.
 */

const ESPN_TEAM_IDS: Record<string, number> = {
  ATL: 1, BOS: 2, NOP: 3, CHI: 4, CLE: 5, DAL: 6, DEN: 7, DET: 8,
  GSW: 9, HOU: 10, IND: 11, LAC: 12, LAL: 13, MIA: 14, MIL: 15,
  MIN: 16, BKN: 17, NYK: 18, ORL: 19, PHI: 20, PHX: 21, POR: 22,
  SAC: 23, SAS: 24, OKC: 25, UTA: 26, WAS: 27, TOR: 28, MEM: 29,
  CHA: 30,
};

interface EspnScheduleEvent {
  date: string;
  competitions: {
    status: { type: { description: string } };
  }[];
}

export interface TeamGameDate {
  date: string;
  status: string;
}

export async function fetchTeamGameDates(teamAbbr: string): Promise<TeamGameDate[]> {
  const espnTeamId = ESPN_TEAM_IDS[teamAbbr.toUpperCase()];
  if (!espnTeamId) {
    throw new Error(`Unknown team abbreviation: ${teamAbbr}`);
  }

  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${espnTeamId}/schedule`,
    { next: { revalidate: 1800 } }
  );

  if (!res.ok) {
    throw new Error(`ESPN schedule API returned ${res.status}`);
  }

  const data = await res.json();
  const events: EspnScheduleEvent[] = data.events ?? [];
  const results: TeamGameDate[] = [];

  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const status = comp.status?.type?.description ?? "";
    // Include Final games (needed for DNP detection)
    if (status === "Canceled") continue;

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toISOString().split("T")[0];

    results.push({ date: dateStr, status });
  }

  return results;
}
