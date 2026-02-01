"use client";

import { useState } from "react";
import { airdropThresholds } from "@/data/airdropThresholds";
import { formatTokenAmount } from "@/lib/formatters";
import {
  Trophy, BarChart3, Flame, Star, Sparkles, Shield, Zap,
  Crown, Award, Target, Eye, Gem, TrendingUp,
  ChevronDown, ChevronUp,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  "bar-chart-3": BarChart3,
  flame: Flame,
  star: Star,
  sparkles: Sparkles,
  shield: Shield,
  zap: Zap,
  crown: Crown,
  award: Award,
  target: Target,
  eye: Eye,
  gem: Gem,
  "trending-up": TrendingUp,
};

export function RewardsGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-bold uppercase tracking-wider text-white/60">
          Reward Types Guide
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
          {airdropThresholds.map((threshold) => {
            const Icon = iconMap[threshold.icon] ?? Star;
            return (
              <div
                key={threshold.type}
                className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFD700]/10">
                  <Icon className="h-4 w-4 text-[#FFD700]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{threshold.label}</span>
                    <span className="text-xs font-bold text-[#FFD700]">
                      {formatTokenAmount(threshold.baseValue)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">{threshold.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
