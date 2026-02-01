"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { MOCK_RECENT_PULLS } from "@/data/mockFeed";

function ratingColor(rating: number) {
  if (rating >= 90) return "bg-[#FFD700] text-black shadow-[0_0_6px_rgba(255,215,0,0.5)]";
  if (rating >= 80) return "bg-purple-500 text-white shadow-[0_0_6px_rgba(139,92,246,0.5)]";
  return "bg-blue-500 text-white";
}

export function RecentPulls() {
  const items = [...MOCK_RECENT_PULLS, ...MOCK_RECENT_PULLS];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/[0.03]">
      {/* Neon glow border effect */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(0,212,255,0.08)]" />

      {/* Accent strip */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#00D4FF] to-transparent opacity-40" />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-[#00D4FF]" />
          <h3 className="text-sm font-bold text-white">Recent Pulls</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4FF] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00D4FF]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00D4FF]/70">Live</span>
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
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          >
            {items.map((pull, i) => (
              <div
                key={i}
                className="mb-2 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00D4FF]/10 text-xs font-bold text-[#00D4FF] ring-1 ring-[#00D4FF]/20">
                  {pull.username[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <span className="font-medium text-white/70">{pull.username}</span>
                  <span className="text-white/30"> pulled </span>
                  <span className="font-medium text-white">{pull.playerName}</span>
                </div>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${ratingColor(pull.overallRating)}`}
                >
                  {pull.overallRating}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
