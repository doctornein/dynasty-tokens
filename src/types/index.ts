export type Rarity = "common" | "rare" | "epic" | "legendary";
export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type PackTier = "starter" | "premium" | "elite" | "dynasty";
export type PackProduct = "starter" | "allstar" | "dynasty";

export interface PlayerStats {
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  mpg: number;
}

export interface PlayerBio {
  height: string;
  weight: string;
  college: string | null;
  country: string;
  draftYear: number | null;
  draftRound: number | null;
  draftPick: number | null;
  yearsPro: number;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  teamAbbr: string;
  position: Position;
  overallRating: number;
  rarity: Rarity;
  stats: PlayerStats;
  jerseyNumber: number;
  image: string | null;
  nbaPersonId: number | null;
  season: number;
  teamId: number;
  bio: PlayerBio;
}

export interface GameLogEntry {
  date: string;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgPct: number;
  fg3Pct: number;
  turnover: number;
  result: string;
}

export interface CareerSeasonEntry {
  season: number;
  gamesPlayed: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fgPct: number;
  fg3Pct: number;
  ftPct: number;
  topg: number;
}

export interface ScheduleEntry {
  gameId: number;
  date: string;
  time: string;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  status: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  tier: PackTier;
  product: PackProduct;
  price: number;
  cardCount: number;
  rarityOdds: Record<Rarity, number>;
  totalSupply: number;
  remaining: number;
  featured: boolean;
  image: string;
  imagePosition?: string;
  guaranteedMinRating?: number;
}

export type AirdropTriggerType =
  // Scoring (exclusive ranges)
  | "20pt_game"
  | "25pt_game"
  | "30pt_game"
  | "35pt_game"
  | "40pt_game"
  | "45pt_game"
  | "50pt_game"
  | "60pt_game"
  // Rebounds (exclusive ranges)
  | "10reb_game"
  | "15reb_game"
  | "20reb_game"
  // Assists (exclusive ranges)
  | "8ast_game"
  | "10ast_game"
  | "15ast_game"
  // Steals (exclusive ranges)
  | "3stl_game"
  | "5stl_game"
  | "7stl_game"
  // Blocks (exclusive ranges)
  | "3blk_game"
  | "5blk_game"
  // Combinations (stackable)
  | "double_double"
  | "triple_double"
  | "quadruple_double"
  | "20_20_game"
  | "5x5_game"
  | "30_10_ast"
  | "25_10_reb"
  // Efficiency
  | "zero_turnover"
  | "efficient_game"
  | "perfect_game"
  // All-around
  | "stat_filler";

export interface AirdropThreshold {
  type: AirdropTriggerType;
  label: string;
  description: string;
  icon: string;
  baseValue: number;
  detect: (game: GameLogEntry) => boolean;
}

export interface Airdrop {
  id: string;
  triggerType: AirdropTriggerType;
  playerId: string;
  playerName: string;
  playerImage: string | null;
  espnId: string;
  gameDate: string;
  opponent: string;
  statLine: string;
  cardsOwned: number;
  baseValue: number;
  totalValue: number;
  depositedAt: string;
}

export interface PerformanceReward {
  id: string;
  triggerType: AirdropTriggerType;
  playerId: string;
  playerName: string;
  playerImage: string | null;
  espnId: string;
  gameDate: string;
  opponent: string;
  statLine: string;
  cardsOwned: number;
  baseValue: number;
  totalValue: number;
  status: "unclaimed" | "claimed" | "redeemed";
  detectedAt: string;
  claimedAt: string | null;
  redeemedAt: string | null;
}

export type TransactionType =
  | "pack_purchase"
  | "airdrop_claim"
  | "airdrop_redeem"
  | "reward_claim"
  | "reward_redeem"
  | "auction_bid"
  | "auction_refund"
  | "auction_sale"
  | "auction_buy"
  | "arena_wager"
  | "arena_win"
  | "arena_refund";

export type AuctionStatus = "active" | "settled" | "cancelled";

export interface Auction {
  id: string;
  sellerId: string;
  sellerUsername: string;
  cardInstanceId: string;
  playerId: string;
  startingBid: number;
  buyNowPrice: number | null;
  currentBid: number | null;
  currentBidderId: string | null;
  bidCount: number;
  status: AuctionStatus;
  endsAt: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderUsername: string;
  amount: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  timestamp: string;
  packId?: string;
  achievementId?: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  header_url: string | null;
  bio: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  balance: number;
  packs_opened: number;
  created_at: string;
  updated_at: string;
}

export interface OwnedCard {
  instanceId: string;
  playerId: string;
  acquiredAt: string;
  packId: string;
}

export type OpeningPhase = "idle" | "tearing" | "revealing" | "summary";

// Arena types
export type ArenaGameType = "1v1" | "3v3" | "5v5";
export type ArenaStatCategory = "PTS" | "REB" | "AST" | "STL" | "BLK";
export type ArenaMatchStatus = "open" | "matched" | "settled" | "voided" | "cancelled";

export interface ArenaMatch {
  id: string;
  gameType: ArenaGameType;
  statCategories: ArenaStatCategory[];
  startDate: string;
  endDate: string;
  wager: number;
  challengerId: string;
  challengerUsername: string;
  opponentId: string | null;
  opponentUsername: string | null;
  invitedUsername: string | null;
  status: ArenaMatchStatus;
  challengerCards: string[];
  opponentCards: string[] | null;
  challengerScore: number | null;
  opponentScore: number | null;
  winnerId: string | null;
  createdAt: string;
  acceptedAt: string | null;
  settledAt: string | null;
}
