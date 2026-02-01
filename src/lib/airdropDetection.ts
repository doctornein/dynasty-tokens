import type { PerformanceReward, AirdropThreshold, GameLogEntry } from "@/types";
import { airdropThresholds } from "@/data/airdropThresholds";

export interface OwnedPlayerInfo {
  playerId: string;
  playerName: string;
  playerImage: string | null;
  espnId: string;
  cards: { instanceId: string; acquiredAt: string }[];
}

/**
 * Count cards acquired strictly before the game date.
 */
export function countCardsOwnedBefore(
  cards: { acquiredAt: string }[],
  gameDate: string
): number {
  const gameTime = new Date(gameDate).getTime();
  return cards.filter((c) => new Date(c.acquiredAt).getTime() < gameTime).length;
}

/**
 * Detect all thresholds a game qualifies for.
 * A single game can trigger multiple non-overlapping thresholds.
 */
export function detectThresholds(game: GameLogEntry): AirdropThreshold[] {
  return airdropThresholds.filter((t) => t.detect(game));
}

function buildStatLine(game: GameLogEntry): string {
  const parts: string[] = [];
  parts.push(`${game.pts} PTS`);
  parts.push(`${game.reb} REB`);
  parts.push(`${game.ast} AST`);
  if (game.stl > 0) parts.push(`${game.stl} STL`);
  if (game.blk > 0) parts.push(`${game.blk} BLK`);
  return parts.join(" / ");
}

/**
 * Process all games for a player and return new performance rewards.
 * Skips games where the user didn't own any cards beforehand,
 * and skips rewards that already exist.
 */
export function processPlayerGames(
  player: OwnedPlayerInfo,
  games: GameLogEntry[],
  existingRewardIds: Set<string>
): PerformanceReward[] {
  const newRewards: PerformanceReward[] = [];

  for (const game of games) {
    const cardsOwned = countCardsOwnedBefore(player.cards, game.date);
    if (cardsOwned === 0) continue;

    const thresholds = detectThresholds(game);
    for (const threshold of thresholds) {
      const id = `${player.espnId}-${game.date}-${threshold.type}`;
      if (existingRewardIds.has(id)) continue;

      newRewards.push({
        id,
        triggerType: threshold.type,
        playerId: player.playerId,
        playerName: player.playerName,
        playerImage: player.playerImage,
        espnId: player.espnId,
        gameDate: game.date,
        opponent: game.opponent,
        statLine: buildStatLine(game),
        cardsOwned,
        baseValue: threshold.baseValue,
        totalValue: threshold.baseValue * cardsOwned,
        status: "unclaimed",
        detectedAt: new Date().toISOString(),
        claimedAt: null,
        redeemedAt: null,
      });
    }
  }

  return newRewards;
}
