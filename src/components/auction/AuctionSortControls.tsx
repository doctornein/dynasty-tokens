"use client";

import { ArrowUpDown, Clock, Flame, ArrowDown, ArrowUp, Hash } from "lucide-react";

export type AuctionSortKey = "ending" | "newest" | "price_low" | "price_high" | "most_bids";

const sortOptions: { key: AuctionSortKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "ending", label: "Ending Soon", icon: Clock },
  { key: "newest", label: "Newest", icon: Flame },
  { key: "price_low", label: "Price Low", icon: ArrowDown },
  { key: "price_high", label: "Price High", icon: ArrowUp },
  { key: "most_bids", label: "Most Bids", icon: Hash },
];

interface AuctionSortControlsProps {
  value: AuctionSortKey;
  onChange: (key: AuctionSortKey) => void;
}

export function AuctionSortControls({ value, onChange }: AuctionSortControlsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <ArrowUpDown className="h-3.5 w-3.5 text-white/30" />
      {sortOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
              : "text-white/40 hover:bg-white/5 hover:text-white/60"
          }`}
        >
          <opt.icon className="h-3 w-3" />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
