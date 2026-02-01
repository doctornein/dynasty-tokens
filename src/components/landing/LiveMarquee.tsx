"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Gavel } from "lucide-react";
import { MOCK_RECENT_PULLS, MOCK_ARENA_HAPPENINGS, MOCK_AUCTION_UPDATES } from "@/data/mockFeed";

interface MarqueeItem {
  icon: "pull" | "win" | "auction";
  text: string;
  accent: string;
}

function buildMarqueeItems(): MarqueeItem[] {
  const items: MarqueeItem[] = [];

  // Big pulls (90+ only)
  for (const p of MOCK_RECENT_PULLS.filter((p) => p.overallRating >= 90)) {
    items.push({
      icon: "pull",
      text: `${p.username} pulled ${p.playerName} (${p.overallRating})`,
      accent: "#FFD700",
    });
  }

  // Arena wins
  for (const h of MOCK_ARENA_HAPPENINGS.filter((h) => h.type === "win")) {
    items.push({
      icon: "win",
      text: `${h.username} defeated ${h.opponentUsername} for ${h.wagerAmount} DT`,
      accent: "#F97316",
    });
  }

  // Big auction sales
  for (const a of MOCK_AUCTION_UPDATES.filter((a) => a.type === "sold")) {
    items.push({
      icon: "auction",
      text: `${a.playerName} sold for ${a.amount} DT`,
      accent: "#10B981",
    });
  }

  return items;
}

const MARQUEE_ITEMS = buildMarqueeItems();

function MarqueeIcon({ type, accent }: { type: MarqueeItem["icon"]; accent: string }) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "pull":
      return <Flame className={cls} style={{ color: accent }} />;
    case "win":
      return <Trophy className={cls} style={{ color: accent }} />;
    case "auction":
      return <Gavel className={cls} style={{ color: accent }} />;
  }
}

export function LiveMarquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/5 bg-black/40 py-2.5 backdrop-blur-sm">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0a0a0f] to-transparent" />

      <motion.div
        className="flex w-max gap-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2">
            <MarqueeIcon type={item.icon} accent={item.accent} />
            <span className="whitespace-nowrap text-xs text-white/60">
              {item.text}
            </span>
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: item.accent, opacity: 0.5 }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
