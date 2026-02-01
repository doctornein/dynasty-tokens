export const DYNASTY_COLORS = {
  background: "#0a0a0f",
  surface: "#12121a",
  surfaceLight: "#1a1a2e",
  border: "#2a2a3e",
  gold: "#FFD700",
  electricBlue: "#00D4FF",
  purple: "#8B5CF6",
  neonPink: "#FF006E",
  success: "#10B981",
  error: "#EF4444",
  textPrimary: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
} as const;

export const RARITY_COLORS = {
  common: { border: "#94A3B8", glow: "rgba(148,163,184,0.3)", label: "Common" },
  rare: { border: "#3B82F6", glow: "rgba(59,130,246,0.4)", label: "Rare" },
  epic: { border: "#8B5CF6", glow: "rgba(139,92,246,0.5)", label: "Epic" },
  legendary: { border: "#FFD700", glow: "rgba(255,215,0,0.6)", label: "Legendary" },
} as const;

export const PACK_TIERS = {
  starter: { name: "Starter", color: "#94A3B8" },
  premium: { name: "Premium", color: "#3B82F6" },
  elite: { name: "Elite", color: "#8B5CF6" },
  dynasty: { name: "Dynasty", color: "#FFD700" },
} as const;

export const CARD_COLORS = {
  blue: "#3B82F6",
  red: "#EF4444",
  gradient: "linear-gradient(135deg, #3B82F6, #EF4444)",
  border: "linear-gradient(135deg, #3B82F6, #EF4444)",
  glow: "rgba(59,130,246,0.4)",
  glowRed: "rgba(239,68,68,0.4)",
} as const;

export const PACK_PRODUCTS = {
  starter: { name: "Starter Booster Pack", color: "#3B82F6", cardCount: 4, price: 10 },
  allstar: { name: "All Star Box", color: "#8B5CF6", cardCount: 25, price: 50 },
  dynasty: { name: "Dynasty Tin", color: "#FFD700", cardCount: 55, price: 100 },
} as const;

export const TOKEN_SYMBOL = "DT";
export const INITIAL_BALANCE = 300;
export const SITE_NAME = "Dynasty Tokens";
