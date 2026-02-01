"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Package, Gavel, Swords, Star } from "lucide-react";
import {
  MOCK_RECENT_PULLS,
  MOCK_AUCTION_UPDATES,
  MOCK_ARENA_HAPPENINGS,
  MOCK_RECENT_REWARDS,
} from "@/data/mockFeed";

interface FeedEntry {
  id: string;
  icon: "pull" | "auction" | "arena" | "reward";
  color: string;
  username: string;
  text: string;
  badge?: { label: string; className: string };
  timeAgo: string;
}

function ratingBadge(rating: number) {
  if (rating >= 90) return { label: `${rating}`, className: "bg-[#FFD700] text-black" };
  if (rating >= 80) return { label: `${rating}`, className: "bg-purple-500 text-white" };
  return { label: `${rating}`, className: "bg-blue-500 text-white" };
}

function buildFeed(): FeedEntry[] {
  const entries: FeedEntry[] = [];

  for (const p of MOCK_RECENT_PULLS) {
    entries.push({
      id: `pull-${p.username}-${p.playerName}`,
      icon: "pull",
      color: "#00D4FF",
      username: p.username,
      text: `pulled ${p.playerName}`,
      badge: ratingBadge(p.overallRating),
      timeAgo: p.timeAgo,
    });
  }

  for (const a of MOCK_AUCTION_UPDATES) {
    const verb =
      a.type === "sold" ? `sold ${a.playerName} for ${a.amount} DT` :
      a.type === "bid" ? `bid ${a.amount} DT on ${a.playerName}` :
      `listed ${a.playerName} for ${a.amount} DT`;
    entries.push({
      id: `auction-${a.username}-${a.playerName}`,
      icon: "auction",
      color: "#10B981",
      username: a.username,
      text: verb,
      timeAgo: a.timeAgo,
    });
  }

  for (const h of MOCK_ARENA_HAPPENINGS) {
    const verb =
      h.type === "win" ? `defeated ${h.opponentUsername} in ${h.gameType} for ${h.wagerAmount} DT` :
      h.type === "wager" ? `wagered ${h.wagerAmount} DT in a ${h.gameType} matchup` :
      `is looking for a ${h.gameType} opponent`;
    entries.push({
      id: `arena-${h.username}-${h.type}-${h.timeAgo}`,
      icon: "arena",
      color: "#F97316",
      username: h.username,
      text: verb,
      timeAgo: h.timeAgo,
    });
  }

  for (const r of MOCK_RECENT_REWARDS) {
    entries.push({
      id: `reward-${r.username}-${r.playerName}`,
      icon: "reward",
      color: "#FFD700",
      username: r.username,
      text: `earned ${r.rewardLabel} from ${r.playerName}`,
      badge: { label: `+${r.valueDT} DT`, className: "bg-[#FFD700]/20 text-[#FFD700]" },
      timeAgo: r.timeAgo,
    });
  }

  // Shuffle deterministically by interleaving types
  const byType = {
    pull: entries.filter((e) => e.icon === "pull"),
    auction: entries.filter((e) => e.icon === "auction"),
    arena: entries.filter((e) => e.icon === "arena"),
    reward: entries.filter((e) => e.icon === "reward"),
  };
  const types = ["pull", "auction", "arena", "reward"] as const;
  const interleaved: FeedEntry[] = [];
  const maxLen = Math.max(...Object.values(byType).map((a) => a.length));
  for (let i = 0; i < maxLen; i++) {
    for (const t of types) {
      if (byType[t][i]) interleaved.push(byType[t][i]);
    }
  }

  return interleaved;
}

const ICON_MAP = {
  pull: Package,
  auction: Gavel,
  arena: Swords,
  reward: Star,
};

export function HeroActivityFeed() {
  const feed = useMemo(() => buildFeed(), []);
  const items = [...feed, ...feed];

  return (
    <div className="flex h-full flex-col border-l border-t border-white/10 bg-black/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-5 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
          <Activity className="h-3.5 w-3.5 text-[#8B5CF6]" />
        </div>
        <h3 className="text-xs font-bold text-white">Live Activity</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8B5CF6] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8B5CF6]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B5CF6]/70">
            Live
          </span>
        </div>
      </div>

      {/* Scrolling feed */}
      <div
        className="flex-1 overflow-hidden px-4 py-1"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <motion.div
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {items.map((entry, i) => {
            const Icon = ICON_MAP[entry.icon];
            return (
              <div
                key={`${entry.id}-${i}`}
                className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.06]"
              >
                <Icon
                  className="h-3 w-3 shrink-0"
                  style={{ color: entry.color }}
                />
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-medium" style={{ color: entry.color }}>
                    {entry.username}
                  </span>
                  <span className="text-white/40"> {entry.text}</span>
                </div>
                {entry.badge && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${entry.badge.className}`}
                  >
                    {entry.badge.label}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
