import { Pack, Player, Rarity } from "@/types";
import { players } from "@/data/players";

const rarityOrder: Rarity[] = ["common", "rare", "epic", "legendary"];

function weightedRandomRarity(odds: Record<Rarity, number>, pityCounter: number): Rarity {
  // Pity mechanic: after 15+ cards without epic+, boost epic/legendary odds
  let adjustedOdds = { ...odds };
  if (pityCounter >= 15) {
    const boost = Math.min((pityCounter - 14) * 0.02, 0.3);
    adjustedOdds.legendary = Math.min(adjustedOdds.legendary + boost * 0.3, 0.6);
    adjustedOdds.epic = Math.min(adjustedOdds.epic + boost * 0.7, 0.6);
    adjustedOdds.common = Math.max(adjustedOdds.common - boost * 0.7, 0.05);
    adjustedOdds.rare = Math.max(adjustedOdds.rare - boost * 0.3, 0.05);
  }

  const total = Object.values(adjustedOdds).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const rarity of rarityOrder) {
    roll -= adjustedOdds[rarity];
    if (roll <= 0) return rarity;
  }
  return "common";
}

function getPlayersByRarity(rarity: Rarity): Player[] {
  return players.filter((p) => p.rarity === rarity);
}

function pickRandomPlayer(pool: Player[]): Player {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(pack: Pack, pityCounter: number = 0): { players: Player[]; newPityCounter: number } {
  const result: Player[] = [];
  let currentPity = pityCounter;

  // If the pack guarantees a min rating, reserve one slot for it
  const normalCount = pack.guaranteedMinRating ? pack.cardCount - 1 : pack.cardCount;

  for (let i = 0; i < normalCount; i++) {
    const rarity = weightedRandomRarity(pack.rarityOdds, currentPity);
    const pool = getPlayersByRarity(rarity);
    const player = pickRandomPlayer(pool);
    result.push(player);

    if (rarity === "epic" || rarity === "legendary") {
      currentPity = 0;
    } else {
      currentPity++;
    }
  }

  // Add guaranteed high-rated player if applicable
  if (pack.guaranteedMinRating) {
    const highRatedPool = players.filter((p) => p.overallRating >= pack.guaranteedMinRating!);
    if (highRatedPool.length > 0) {
      result.push(pickRandomPlayer(highRatedPool));
    } else {
      // Fallback: pick the highest rated player available
      const sorted = [...players].sort((a, b) => b.overallRating - a.overallRating);
      result.push(sorted[0]);
    }
  }

  // Sort by overallRating ascending (best revealed last)
  result.sort((a, b) => a.overallRating - b.overallRating);

  return { players: result, newPityCounter: currentPity };
}

export function getBestCard(cards: Player[]): Player {
  return cards.reduce((best, card) => {
    if (card.overallRating > best.overallRating) return card;
    return best;
  }, cards[0]);
}
