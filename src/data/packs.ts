import { Pack } from "@/types";

const UNIFORM_ODDS = { common: 0.65, rare: 0.25, epic: 0.08, legendary: 0.02 } as const;

export const packs: Pack[] = [
  {
    id: "pack-starter",
    name: "Starter Booster Pack",
    description: "4 cards to get you on the court. Fast, affordable, and full of potential.",
    tier: "starter",
    product: "starter",
    price: 10,
    cardCount: 4,
    rarityOdds: { ...UNIFORM_ODDS },
    totalSupply: 99999,
    remaining: 99999,
    featured: true,
    image: "",
  },
  {
    id: "pack-allstar",
    name: "All Star Box",
    description: "25 cards in a single rip. Build serious depth and chase rare talent.",
    tier: "premium",
    product: "allstar",
    price: 50,
    cardCount: 25,
    rarityOdds: { ...UNIFORM_ODDS },
    totalSupply: 99999,
    remaining: 99999,
    featured: true,
    image: "",
  },
  {
    id: "pack-dynasty",
    name: "Dynasty Tin",
    description: "55 cards plus a guaranteed star player. The ultimate collector's experience.",
    tier: "dynasty",
    product: "dynasty",
    price: 100,
    cardCount: 55,
    rarityOdds: { ...UNIFORM_ODDS },
    totalSupply: 99999,
    remaining: 99999,
    featured: true,
    image: "",
    guaranteedMinRating: 90,
  },
];
