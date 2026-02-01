"use client";

import { ArrowUpDown, Clock, Trophy, Star } from "lucide-react";

export type SortKey = "recent" | "rewards" | "rating" | "name";

const sortOptions: { key: SortKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "recent", label: "Recent", icon: Clock },
  { key: "rewards", label: "Rewards", icon: Trophy },
  { key: "rating", label: "Rating", icon: Star },
];

interface SortControlsProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
  showRewards?: boolean;
}

export function SortControls({ value, onChange, showRewards = true }: SortControlsProps) {
  const options = showRewards ? sortOptions : sortOptions.filter((o) => o.key !== "rewards");

  return (
    <div className="flex items-center gap-1.5">
      <ArrowUpDown className="h-3.5 w-3.5 text-white/30" />
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-[#FFD700]/10 text-[#FFD700]"
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
