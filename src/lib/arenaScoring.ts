import { ArenaStatCategory, GameLogEntry } from "@/types";

const STAT_KEYS: Record<ArenaStatCategory, keyof GameLogEntry> = {
  PTS: "pts",
  REB: "reb",
  AST: "ast",
  STL: "stl",
  BLK: "blk",
};

/**
 * Sum selected stat categories across all game logs in the date range.
 */
export function calculateScore(
  gameLogs: GameLogEntry[],
  startDate: string,
  endDate: string,
  statCategories: ArenaStatCategory[]
): number {
  let total = 0;
  for (const game of gameLogs) {
    const gameDate = game.date;
    if (gameDate >= startDate && gameDate <= endDate) {
      for (const cat of statCategories) {
        total += Number(game[STAT_KEYS[cat]]) || 0;
      }
    }
  }
  return total;
}

/**
 * Detect if a player Did Not Play (DNP).
 * DNP = team had a game on a date in the range, but the player has no game log for that date.
 */
export function detectDNP(
  teamGameDates: string[],
  playerGameLogDates: string[],
  startDate: string,
  endDate: string
): boolean {
  const playerDates = new Set(playerGameLogDates);

  for (const date of teamGameDates) {
    if (date >= startDate && date <= endDate) {
      if (!playerDates.has(date)) {
        return true;
      }
    }
  }

  return false;
}
