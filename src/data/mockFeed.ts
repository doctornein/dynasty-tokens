export interface MockPull {
  username: string;
  playerName: string;
  playerImage: string;
  overallRating: number;
  timeAgo: string;
}

export interface MockArenaHappening {
  type: "wager" | "win" | "looking";
  username: string;
  opponentUsername?: string;
  gameType: string;
  wagerAmount?: number;
  timeAgo: string;
}

export interface MockAuction {
  type: "bid" | "sold" | "listed";
  username: string;
  playerName: string;
  overallRating: number;
  amount: number;
  timeAgo: string;
}

export interface MockReward {
  username: string;
  rewardLabel: string;
  playerName: string;
  valueDT: number;
  timeAgo: string;
}

export const MOCK_RECENT_PULLS: MockPull[] = [
  { username: "hoopsfan23", playerName: "Giannis Antetokounmpo", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/3032977.png", overallRating: 99, timeAgo: "2m ago" },
  { username: "dynasty_king", playerName: "Luka Doncic", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/3945274.png", overallRating: 99, timeAgo: "4m ago" },
  { username: "courtside_joe", playerName: "Shai Gilgeous-Alexander", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4278073.png", overallRating: 99, timeAgo: "6m ago" },
  { username: "ballin_bob", playerName: "Jaylen Brown", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/3917376.png", overallRating: 99, timeAgo: "8m ago" },
  { username: "swish_master", playerName: "Nikola Jokic", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/3112335.png", overallRating: 99, timeAgo: "11m ago" },
  { username: "dunk_city", playerName: "Jayson Tatum", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4065648.png", overallRating: 96, timeAgo: "14m ago" },
  { username: "triple_dbl", playerName: "Anthony Edwards", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4594268.png", overallRating: 95, timeAgo: "18m ago" },
  { username: "fadeaway_kid", playerName: "LeBron James", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/1966.png", overallRating: 93, timeAgo: "22m ago" },
  { username: "net_burner", playerName: "De'Aaron Fox", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4066259.png", overallRating: 85, timeAgo: "25m ago" },
  { username: "rim_runner", playerName: "Tyrese Haliburton", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4395725.png", overallRating: 82, timeAgo: "30m ago" },
  { username: "glass_cleaner", playerName: "Jalen Brunson", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/3934672.png", overallRating: 78, timeAgo: "35m ago" },
  { username: "ankle_break", playerName: "Cade Cunningham", playerImage: "https://a.espncdn.com/i/headshots/nba/players/full/4432166.png", overallRating: 72, timeAgo: "40m ago" },
];

export const MOCK_AUCTION_UPDATES: MockAuction[] = [
  { type: "sold", username: "dynasty_king", playerName: "Giannis Antetokounmpo", overallRating: 99, amount: 480, timeAgo: "1m ago" },
  { type: "bid", username: "hoopsfan23", playerName: "Luka Doncic", overallRating: 99, amount: 520, timeAgo: "2m ago" },
  { type: "listed", username: "swish_master", playerName: "Shai Gilgeous-Alexander", overallRating: 99, amount: 400, timeAgo: "3m ago" },
  { type: "bid", username: "courtside_joe", playerName: "Jayson Tatum", overallRating: 96, amount: 310, timeAgo: "5m ago" },
  { type: "sold", username: "triple_dbl", playerName: "Anthony Edwards", overallRating: 95, amount: 275, timeAgo: "7m ago" },
  { type: "listed", username: "fadeaway_kid", playerName: "LeBron James", overallRating: 93, amount: 350, timeAgo: "9m ago" },
  { type: "bid", username: "dunk_city", playerName: "Nikola Jokic", overallRating: 99, amount: 490, timeAgo: "11m ago" },
  { type: "sold", username: "net_burner", playerName: "Jaylen Brown", overallRating: 99, amount: 445, timeAgo: "14m ago" },
  { type: "listed", username: "rim_runner", playerName: "De'Aaron Fox", overallRating: 85, amount: 120, timeAgo: "17m ago" },
  { type: "bid", username: "glass_cleaner", playerName: "Tyrese Haliburton", overallRating: 82, amount: 95, timeAgo: "20m ago" },
  { type: "sold", username: "ballin_bob", playerName: "Jalen Brunson", overallRating: 78, amount: 65, timeAgo: "24m ago" },
  { type: "listed", username: "ankle_break", playerName: "Cade Cunningham", overallRating: 72, amount: 40, timeAgo: "28m ago" },
];

export const MOCK_ARENA_HAPPENINGS: MockArenaHappening[] = [
  { type: "wager", username: "hoopsfan23", gameType: "1v1", wagerAmount: 50, timeAgo: "1m ago" },
  { type: "win", username: "dynasty_king", opponentUsername: "ballin_bob", gameType: "3v3", wagerAmount: 120, timeAgo: "3m ago" },
  { type: "looking", username: "swish_master", gameType: "5v5", timeAgo: "5m ago" },
  { type: "wager", username: "courtside_joe", gameType: "3v3", wagerAmount: 75, timeAgo: "7m ago" },
  { type: "win", username: "triple_dbl", opponentUsername: "fadeaway_kid", gameType: "1v1", wagerAmount: 200, timeAgo: "9m ago" },
  { type: "looking", username: "dunk_city", gameType: "1v1", timeAgo: "12m ago" },
  { type: "wager", username: "net_burner", gameType: "5v5", wagerAmount: 30, timeAgo: "15m ago" },
  { type: "win", username: "rim_runner", opponentUsername: "ankle_break", gameType: "3v3", wagerAmount: 90, timeAgo: "18m ago" },
  { type: "looking", username: "glass_cleaner", gameType: "3v3", timeAgo: "20m ago" },
  { type: "wager", username: "fadeaway_kid", gameType: "1v1", wagerAmount: 150, timeAgo: "23m ago" },
  { type: "win", username: "ballin_bob", opponentUsername: "net_burner", gameType: "5v5", wagerAmount: 60, timeAgo: "28m ago" },
  { type: "looking", username: "ankle_break", gameType: "5v5", timeAgo: "32m ago" },
];

export const MOCK_RECENT_REWARDS: MockReward[] = [
  { username: "dynasty_king", rewardLabel: "Triple Double", playerName: "Nikola Jokic", valueDT: 80, timeAgo: "2m ago" },
  { username: "hoopsfan23", rewardLabel: "40-Point Takeover", playerName: "Luka Doncic", valueDT: 100, timeAgo: "5m ago" },
  { username: "swish_master", rewardLabel: "Defensive Lockdown", playerName: "Giannis Antetokounmpo", valueDT: 60, timeAgo: "8m ago" },
  { username: "courtside_joe", rewardLabel: "Double Double", playerName: "Jayson Tatum", valueDT: 45, timeAgo: "11m ago" },
  { username: "ballin_bob", rewardLabel: "Buzzer Beater", playerName: "Anthony Edwards", valueDT: 75, timeAgo: "14m ago" },
  { username: "triple_dbl", rewardLabel: "Triple Double", playerName: "LeBron James", valueDT: 80, timeAgo: "17m ago" },
  { username: "dunk_city", rewardLabel: "Poster Dunk", playerName: "Shai Gilgeous-Alexander", valueDT: 55, timeAgo: "20m ago" },
  { username: "fadeaway_kid", rewardLabel: "40-Point Takeover", playerName: "Jaylen Brown", valueDT: 100, timeAgo: "24m ago" },
  { username: "net_burner", rewardLabel: "Assist King", playerName: "Tyrese Haliburton", valueDT: 40, timeAgo: "27m ago" },
  { username: "rim_runner", rewardLabel: "Double Double", playerName: "Cade Cunningham", valueDT: 45, timeAgo: "31m ago" },
  { username: "glass_cleaner", rewardLabel: "Defensive Lockdown", playerName: "De'Aaron Fox", valueDT: 60, timeAgo: "35m ago" },
  { username: "ankle_break", rewardLabel: "Buzzer Beater", playerName: "Jalen Brunson", valueDT: 75, timeAgo: "40m ago" },
];
