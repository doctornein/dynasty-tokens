"use client";

import { motion } from "framer-motion";
import { Gift, Star } from "lucide-react";
import { MOCK_RECENT_REWARDS } from "@/data/mockFeed";

export function RecentRewards() {
  const items = [...MOCK_RECENT_REWARDS, ...MOCK_RECENT_REWARDS];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03]">
      {/* Neon glow border effect */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,215,0,0.06)]" />

      {/* Accent strip */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#FFD700] to-transparent opacity-40" />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-[#FFD700]" />
          <h3 className="text-sm font-bold text-white">Rewards</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD700]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#FFD700]/70">Live</span>
          </div>
        </div>

        <div
          className="relative overflow-hidden"
          style={{
            height: 300,
            maskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <motion.div
            animate={{ y: ["0%", "-50%"] }}
            transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
          >
            {items.map((r, i) => (
              <div
                key={i}
                className="mb-2 flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <div className="mt-0.5 shrink-0">
                  <Star className="h-3.5 w-3.5 text-[#FFD700]" />
                </div>
                <div className="min-w-0 flex-1 text-xs leading-relaxed">
                  <span className="font-medium text-white/70">{r.username}</span>
                  <span className="text-white/30"> earned </span>
                  <span className="font-bold text-[#FFD700]">{r.rewardLabel}</span>
                  <span className="text-white/30"> on </span>
                  <span className="font-medium text-white">{r.playerName}</span>
                  <span className="text-white/30"> for </span>
                  <span className="font-bold text-[#FFD700]">{r.valueDT} DT</span>
                </div>
                <span className="shrink-0 text-[10px] text-white/20">{r.timeAgo}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
