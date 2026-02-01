import type { AirdropThreshold } from "@/types";

/**
 * Performance reward thresholds — ordered from most valuable to least.
 * Scoring / rebounding / assist / steal / block tiers use exclusive ranges
 * so a single stat line doesn't fire every lower tier.
 * Combination rewards (double-double, triple-double, etc.) stack on top.
 *
 * Values are intentionally small (pennies) — DT is pegged to USD and
 * packs cost 10 / 50 / 100 DT.
 */

function countDoubleDigits(pts: number, reb: number, ast: number, stl: number, blk: number): number {
  return [pts, reb, ast, stl, blk].filter((v) => v >= 10).length;
}

export const airdropThresholds: AirdropThreshold[] = [
  // ── Scoring (exclusive ranges) ──────────────────────────────────────
  {
    type: "60pt_game",
    label: "60+ Point Eruption",
    description: "Scored 60 or more points in a single game",
    icon: "crown",
    baseValue: 5.0,
    detect: (game) => game.pts >= 60,
  },
  {
    type: "50pt_game",
    label: "50-Point Explosion",
    description: "Scored 50–59 points in a single game",
    icon: "crown",
    baseValue: 3.0,
    detect: (game) => game.pts >= 50 && game.pts < 60,
  },
  {
    type: "45pt_game",
    label: "45-Point Blaze",
    description: "Scored 45–49 points in a single game",
    icon: "star",
    baseValue: 2.0,
    detect: (game) => game.pts >= 45 && game.pts < 50,
  },
  {
    type: "40pt_game",
    label: "40-Point Takeover",
    description: "Scored 40–44 points in a single game",
    icon: "star",
    baseValue: 0.5,
    detect: (game) => game.pts >= 40 && game.pts < 45,
  },
  {
    type: "35pt_game",
    label: "35-Point Night",
    description: "Scored 35–39 points in a single game",
    icon: "flame",
    baseValue: 0.15,
    detect: (game) => game.pts >= 35 && game.pts < 40,
  },
  {
    type: "30pt_game",
    label: "30-Point Outing",
    description: "Scored 30–34 points in a single game",
    icon: "flame",
    baseValue: 0.05,
    detect: (game) => game.pts >= 30 && game.pts < 35,
  },
  {
    type: "25pt_game",
    label: "25-Point Game",
    description: "Scored 25–29 points in a single game",
    icon: "zap",
    baseValue: 0.02,
    detect: (game) => game.pts >= 25 && game.pts < 30,
  },
  {
    type: "20pt_game",
    label: "20-Point Game",
    description: "Scored 20–24 points in a single game",
    icon: "zap",
    baseValue: 0.01,
    detect: (game) => game.pts >= 20 && game.pts < 25,
  },

  // ── Rebounds (exclusive ranges) ─────────────────────────────────────
  {
    type: "20reb_game",
    label: "20+ Rebound Monster",
    description: "Grabbed 20 or more rebounds in a single game",
    icon: "trophy",
    baseValue: 0.25,
    detect: (game) => game.reb >= 20,
  },
  {
    type: "15reb_game",
    label: "15-Rebound Game",
    description: "Grabbed 15–19 rebounds in a single game",
    icon: "shield",
    baseValue: 0.05,
    detect: (game) => game.reb >= 15 && game.reb < 20,
  },
  {
    type: "10reb_game",
    label: "10-Rebound Game",
    description: "Grabbed 10–14 rebounds in a single game",
    icon: "shield",
    baseValue: 0.01,
    detect: (game) => game.reb >= 10 && game.reb < 15,
  },

  // ── Assists (exclusive ranges) ──────────────────────────────────────
  {
    type: "15ast_game",
    label: "15+ Assist Masterclass",
    description: "Dished 15 or more assists in a single game",
    icon: "gem",
    baseValue: 0.2,
    detect: (game) => game.ast >= 15,
  },
  {
    type: "10ast_game",
    label: "10-Assist Game",
    description: "Dished 10–14 assists in a single game",
    icon: "sparkles",
    baseValue: 0.02,
    detect: (game) => game.ast >= 10 && game.ast < 15,
  },
  {
    type: "8ast_game",
    label: "8-Assist Game",
    description: "Dished 8–9 assists in a single game",
    icon: "sparkles",
    baseValue: 0.01,
    detect: (game) => game.ast >= 8 && game.ast < 10,
  },

  // ── Steals (exclusive ranges) ───────────────────────────────────────
  {
    type: "7stl_game",
    label: "7+ Steal Heist",
    description: "Recorded 7 or more steals in a single game",
    icon: "target",
    baseValue: 0.5,
    detect: (game) => game.stl >= 7,
  },
  {
    type: "5stl_game",
    label: "5-Steal Game",
    description: "Recorded 5–6 steals in a single game",
    icon: "eye",
    baseValue: 0.1,
    detect: (game) => game.stl >= 5 && game.stl < 7,
  },
  {
    type: "3stl_game",
    label: "3-Steal Game",
    description: "Recorded 3–4 steals in a single game",
    icon: "eye",
    baseValue: 0.01,
    detect: (game) => game.stl >= 3 && game.stl < 5,
  },

  // ── Blocks (exclusive ranges) ───────────────────────────────────────
  {
    type: "5blk_game",
    label: "5+ Block Party",
    description: "Recorded 5 or more blocks in a single game",
    icon: "shield",
    baseValue: 0.1,
    detect: (game) => game.blk >= 5,
  },
  {
    type: "3blk_game",
    label: "3-Block Game",
    description: "Recorded 3–4 blocks in a single game",
    icon: "shield",
    baseValue: 0.01,
    detect: (game) => game.blk >= 3 && game.blk < 5,
  },

  // ── Combinations (stackable with stat tiers) ────────────────────────
  {
    type: "quadruple_double",
    label: "Quadruple-Double",
    description: "10+ in four statistical categories — historic",
    icon: "award",
    baseValue: 5.0,
    detect: (game) => countDoubleDigits(game.pts, game.reb, game.ast, game.stl, game.blk) >= 4,
  },
  {
    type: "5x5_game",
    label: "5×5 Game",
    description: "5+ points, rebounds, assists, steals, and blocks",
    icon: "award",
    baseValue: 1.0,
    detect: (game) =>
      game.pts >= 5 && game.reb >= 5 && game.ast >= 5 && game.stl >= 5 && game.blk >= 5,
  },
  {
    type: "20_20_game",
    label: "20/20 Game",
    description: "20+ points and 20+ rebounds in a single game",
    icon: "trophy",
    baseValue: 0.75,
    detect: (game) => game.pts >= 20 && game.reb >= 20,
  },
  {
    type: "30_10_ast",
    label: "30/10 Scorer-Playmaker",
    description: "30+ points and 10+ assists in a single game",
    icon: "trending-up",
    baseValue: 0.5,
    detect: (game) => game.pts >= 30 && game.ast >= 10,
  },
  {
    type: "25_10_reb",
    label: "25/10 Scorer-Rebounder",
    description: "25+ points and 10+ rebounds in a single game",
    icon: "trending-up",
    baseValue: 0.5,
    detect: (game) => game.pts >= 25 && game.reb >= 10,
  },
  {
    type: "triple_double",
    label: "Triple-Double",
    description: "10+ in three statistical categories",
    icon: "bar-chart-3",
    baseValue: 0.25,
    detect: (game) => countDoubleDigits(game.pts, game.reb, game.ast, game.stl, game.blk) >= 3,
  },
  {
    type: "double_double",
    label: "Double-Double",
    description: "10+ in two statistical categories",
    icon: "bar-chart-3",
    baseValue: 0.03,
    detect: (game) => countDoubleDigits(game.pts, game.reb, game.ast, game.stl, game.blk) >= 2,
  },

  // ── Efficiency ──────────────────────────────────────────────────────
  {
    type: "perfect_game",
    label: "Perfect Shooting",
    description: "100% from the field with 10+ points",
    icon: "gem",
    baseValue: 0.1,
    detect: (game) => game.fgPct === 100 && game.pts >= 10,
  },
  {
    type: "efficient_game",
    label: "Hyper-Efficient",
    description: "70%+ FG with 25+ points",
    icon: "target",
    baseValue: 0.05,
    detect: (game) => game.fgPct >= 70 && game.pts >= 25,
  },
  {
    type: "zero_turnover",
    label: "Zero Turnovers",
    description: "Zero turnovers with 20+ points scored",
    icon: "target",
    baseValue: 0.05,
    detect: (game) => game.turnover === 0 && game.pts >= 20,
  },

  // ── All-around ──────────────────────────────────────────────────────
  {
    type: "stat_filler",
    label: "Stat-Sheet Stuffer",
    description: "5+ in four out of five stat categories",
    icon: "bar-chart-3",
    baseValue: 0.15,
    detect: (game) =>
      [game.pts, game.reb, game.ast, game.stl, game.blk].filter((v) => v >= 5).length >= 4,
  },
];
