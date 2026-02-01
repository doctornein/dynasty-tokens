import useSWR from "swr";
import type { GameLogEntry, CareerSeasonEntry, ScheduleEntry } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    return r.json();
  });

const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 60_000,
} as const;

/**
 * Extract ESPN athlete ID from a headshot URL like:
 * https://a.espncdn.com/i/headshots/nba/players/full/3032977.png
 */
function extractEspnId(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/players\/full\/(\d+)/);
  return match ? match[1] : null;
}

export function useGameLog(imageUrl: string | null, season: number) {
  const espnId = extractEspnId(imageUrl);
  return useSWR<GameLogEntry[]>(
    espnId ? `/api/players/${espnId}/game-log?season=${season}` : null,
    fetcher,
    swrOptions
  );
}

export function useCareerStats(imageUrl: string | null) {
  const espnId = extractEspnId(imageUrl);
  return useSWR<CareerSeasonEntry[]>(
    espnId ? `/api/players/${espnId}/career` : null,
    fetcher,
    swrOptions
  );
}

export function useTeamSchedule(teamAbbr: string | null) {
  return useSWR<ScheduleEntry[]>(
    teamAbbr ? `/api/teams/${teamAbbr}/schedule` : null,
    fetcher,
    swrOptions
  );
}

export interface EspnBio {
  height: string;
  weight: string;
  experience: string;
  draft: string;
  birthPlace: string;
  college: string | null;
}

export function usePlayerBio(imageUrl: string | null) {
  const espnId = extractEspnId(imageUrl);
  return useSWR<EspnBio>(
    espnId ? `/api/players/${espnId}/bio` : null,
    fetcher,
    { ...swrOptions, dedupingInterval: 300_000 } // 5 min dedup — bio rarely changes
  );
}

export function useFullGameLog(imageUrl: string | null) {
  const espnId = extractEspnId(imageUrl);
  return useSWR<GameLogEntry[]>(
    espnId ? `/api/players/${espnId}/game-log?full=true` : null,
    fetcher,
    { ...swrOptions, dedupingInterval: 300_000 }
  );
}
