export interface Team {
  name: string;
  abbr: string;
  conference: "East" | "West";
}

export const teams: Team[] = [
  { name: "Atlanta Hawks", abbr: "ATL", conference: "East" },
  { name: "Boston Celtics", abbr: "BOS", conference: "East" },
  { name: "Brooklyn Nets", abbr: "BKN", conference: "East" },
  { name: "Charlotte Hornets", abbr: "CHA", conference: "East" },
  { name: "Chicago Bulls", abbr: "CHI", conference: "East" },
  { name: "Cleveland Cavaliers", abbr: "CLE", conference: "East" },
  { name: "Dallas Mavericks", abbr: "DAL", conference: "West" },
  { name: "Denver Nuggets", abbr: "DEN", conference: "West" },
  { name: "Detroit Pistons", abbr: "DET", conference: "East" },
  { name: "Golden State Warriors", abbr: "GSW", conference: "West" },
  { name: "Houston Rockets", abbr: "HOU", conference: "West" },
  { name: "Indiana Pacers", abbr: "IND", conference: "East" },
  { name: "LA Clippers", abbr: "LAC", conference: "West" },
  { name: "Los Angeles Lakers", abbr: "LAL", conference: "West" },
  { name: "Memphis Grizzlies", abbr: "MEM", conference: "West" },
  { name: "Miami Heat", abbr: "MIA", conference: "East" },
  { name: "Milwaukee Bucks", abbr: "MIL", conference: "East" },
  { name: "Minnesota Timberwolves", abbr: "MIN", conference: "West" },
  { name: "New Orleans Pelicans", abbr: "NOP", conference: "West" },
  { name: "New York Knicks", abbr: "NYK", conference: "East" },
  { name: "Oklahoma City Thunder", abbr: "OKC", conference: "West" },
  { name: "Orlando Magic", abbr: "ORL", conference: "East" },
  { name: "Philadelphia 76ers", abbr: "PHI", conference: "East" },
  { name: "Phoenix Suns", abbr: "PHX", conference: "West" },
  { name: "Portland Trail Blazers", abbr: "POR", conference: "West" },
  { name: "Sacramento Kings", abbr: "SAC", conference: "West" },
  { name: "San Antonio Spurs", abbr: "SAS", conference: "West" },
  { name: "Toronto Raptors", abbr: "TOR", conference: "East" },
  { name: "Utah Jazz", abbr: "UTA", conference: "West" },
  { name: "Washington Wizards", abbr: "WAS", conference: "East" },
];
