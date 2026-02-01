import type { PlayerStats, Rarity } from "@/types";

/**
 * Compute a raw score from player season averages using a weighted formula.
 */
export function computeRawScore(stats: PlayerStats): number {
  return (
    stats.ppg * 2.0 +
    stats.rpg * 1.2 +
    stats.apg * 1.5 +
    stats.spg * 3.0 +
    stats.bpg * 3.0 +
    stats.fgPct * 0.3 +
    stats.fg3Pct * 0.15 +
    stats.ftPct * 0.1 +
    stats.mpg * 0.4
  );
}

/**
 * Map a raw score (typically ~20-120) to a 65-99 overall rating.
 */
export function rawToRating(raw: number): number {
  const MIN_RAW = 20;
  const MAX_RAW = 120;
  const MIN_RATING = 65;
  const MAX_RATING = 99;

  const clamped = Math.max(MIN_RAW, Math.min(MAX_RAW, raw));
  const normalized = (clamped - MIN_RAW) / (MAX_RAW - MIN_RAW);
  return Math.round(MIN_RATING + normalized * (MAX_RATING - MIN_RATING));
}

/**
 * Compute the overall rating for a player from their stats.
 */
export function computeOverallRating(stats: PlayerStats): number {
  return rawToRating(computeRawScore(stats));
}

/**
 * Assign rarity tiers by percentile ranking.
 *
 * Players must already be sorted by overallRating descending.
 * - Top 5%  → Legendary
 * - Next 10% → Epic
 * - Next 20% → Rare
 * - Bottom 65% → Common
 */
export function assignRarities(
  sortedRatings: { index: number; rating: number }[]
): Map<number, Rarity> {
  const total = sortedRatings.length;
  const result = new Map<number, Rarity>();

  const legendaryCount = Math.max(1, Math.round(total * 0.05));
  const epicCount = Math.max(1, Math.round(total * 0.10));
  const rareCount = Math.max(1, Math.round(total * 0.20));

  for (let i = 0; i < sortedRatings.length; i++) {
    const { index } = sortedRatings[i];
    let rarity: Rarity;

    if (i < legendaryCount) {
      rarity = "legendary";
    } else if (i < legendaryCount + epicCount) {
      rarity = "epic";
    } else if (i < legendaryCount + epicCount + rareCount) {
      rarity = "rare";
    } else {
      rarity = "common";
    }

    result.set(index, rarity);
  }

  return result;
}
