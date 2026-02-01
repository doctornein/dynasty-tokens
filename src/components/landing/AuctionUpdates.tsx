"use client";

import { motion } from "framer-motion";
import { Gavel, Tag, CircleDollarSign } from "lucide-react";
import { MOCK_AUCTION_UPDATES, MockAuction } from "@/data/mockFeed";

function AuctionIcon({ type }: { type: MockAuction["type"] }) {
  switch (type) {
    case "bid":
      return <Gavel className="h-3.5 w-3.5 text-[#10B981]" />;
    case "sold":
      return <CircleDollarSign className="h-3.5 w-3.5 text-[#10B981]" />;
    case "listed":
      return <Tag className="h-3.5 w-3.5 text-[#10B981]" />;
  }
}

function auctionText(a: MockAuction) {
  switch (a.type) {
    case "bid":
      return (
        <>
          <span className="font-medium text-white/70">{a.username}</span>
          <span className="text-white/30"> bid </span>
          <span className="font-bold text-[#10B981]">{a.amount} DT</span>
          <span className="text-white/30"> on </span>
          <span className="font-medium text-white">{a.playerName}</span>
        </>
      );
    case "sold":
      return (
        <>
          <span className="font-medium text-white">{a.playerName}</span>
          <span className="text-white/30"> sold to </span>
          <span className="font-medium text-white/70">{a.username}</span>
          <span className="text-white/30"> for </span>
          <span className="font-bold text-[#10B981]">{a.amount} DT</span>
        </>
      );
    case "listed":
      return (
        <>
          <span className="font-medium text-white/70">{a.username}</span>
          <span className="text-white/30"> listed </span>
          <span className="font-medium text-white">{a.playerName}</span>
          <span className="text-white/30"> for </span>
          <span className="font-bold text-[#10B981]">{a.amount} DT</span>
        </>
      );
  }
}

export function AuctionUpdates() {
  const items = [...MOCK_AUCTION_UPDATES, ...MOCK_AUCTION_UPDATES];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#10B981]/20 bg-[#10B981]/[0.03]">
      {/* Neon glow border effect */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.08)]" />

      {/* Accent strip */}
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#10B981] to-transparent opacity-40" />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-center gap-2">
          <Gavel className="h-4 w-4 text-[#10B981]" />
          <h3 className="text-sm font-bold text-white">Auction House</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#10B981]/70">Live</span>
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
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            {items.map((a, i) => (
              <div
                key={i}
                className="mb-2 flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <div className="mt-0.5 shrink-0">
                  <AuctionIcon type={a.type} />
                </div>
                <div className="min-w-0 flex-1 text-xs leading-relaxed">
                  {auctionText(a)}
                </div>
                <span className="shrink-0 text-[10px] text-white/20">{a.timeAgo}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
