import useSWR from "swr";
import type { ScheduleEntry } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    return r.json();
  });

export function useTeamScheduleByAbbr(teamAbbr: string | null) {
  return useSWR<ScheduleEntry[]>(
    teamAbbr ? `/api/teams/${teamAbbr}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
}
