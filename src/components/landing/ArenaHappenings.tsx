"use client";

import { motion } from "framer-motion";
import { Swords, Trophy, Eye } from "lucide-react";
import { MOCK_ARENA_HAPPENINGS, MockArenaHappening } from "@/data/mockFeed";

function HappeningIcon({ type }: { type: MockArenaHappening["type"] }) {
  switch (type) {
    case "wager":
      return <Swords className="h-3.5 w-3.5 text-[#F97316]" />;
    case "win":
      return <Trophy className="h-3.5 w-3.5 text-[#F97316]" />;
    case "looking":
      return <Eye className="h-3.5 w-3.5 text-[#F97316]" />;
  }
}

function happeningText(h: MockArenaHappening) {
  switch (h.type) {
    case "wager":
      return (
        <>
          <span className="font-medium text-white/70">{h.username}</span>
          <span className="text-white/30"> wagered </span>
          <span className="font-bold text-[#F97316]">{h.wagerAmount} DT</span>
          <span className="text-white/30"> in a {h.gameType} matchup</span>
        </>
      );
    case "win":
      return (
        <>
          <span className="font-medium text-white/70">{h.username}</span>
          <span className="text-white/30"> defeated </span>
          <span className="font-medium text-white/70">{h.opponentUsername}</span>
          <span className="text-white/30"> in a {h.gameType} for </span>
          <span className="font-bold text-[#F97316]">{h.wagerAmount} DT</span>
        </>
      );
    case "looking":
      return (
        <>
          <span className="font-medium text-white/70">{h.username}</span>
          <span className="text-white/30"> is looking for a {h.gameType} opponent</span>
        </>
      );
  }
}

export function ArenaHappenings() {
  const items = [...MOCK_ARENA_HAPPENINGS, ...MOCK_ARENA_HAPPENINGS];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.03]">
      {/* Neon glow border effect */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(249,115,22,0.08)]" />

      {/* Accent strip */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#F97316] to-transparent opacity-40" />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-center gap-2">
          <Swords className="h-4 w-4 text-[#F97316]" />
          <h3 className="text-sm font-bold text-white">Arena Activity</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F97316]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#F97316]/70">Live</span>
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
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          >
            {items.map((h, i) => (
              <div
                key={i}
                className="mb-2 flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <div className="mt-0.5 shrink-0">
                  <HappeningIcon type={h.type} />
                </div>
                <div className="min-w-0 flex-1 text-xs leading-relaxed">
                  {happeningText(h)}
                </div>
                <span className="shrink-0 text-[10px] text-white/20">{h.timeAgo}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
