"use client";

import type { PerformanceReward } from "@/types";
import { airdropThresholds } from "@/data/airdropThresholds";
import { formatTokenAmount } from "@/lib/formatters";
import {
  Trophy, BarChart3, Flame, Star, Sparkles, Shield, Zap,
  Crown, Award, Target, Eye, Gem, TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";

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

interface RewardBadgeProps {
  reward: PerformanceReward;
  selected?: boolean;
  onToggle?: () => void;
}

export function RewardBadge({ reward, selected, onToggle }: RewardBadgeProps) {
  const threshold = airdropThresholds.find((t) => t.type === reward.triggerType);
  const Icon = iconMap[threshold?.icon ?? "star"] ?? Star;

  const gameDate = new Date(reward.gameDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const isUnclaimed = reward.status === "unclaimed";
  const isRedeemed = reward.status === "redeemed";

  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        isUnclaimed && "animate-pulse-subtle border-[#FFD700]/40 bg-[#FFD700]/5",
        reward.status === "claimed" && "border-white/20 bg-white/5",
        isRedeemed && "border-white/10 bg-white/[0.02] opacity-60",
        selected && "ring-2 ring-[#FFD700]/60",
      )}
    >
      {/* Player headshot */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
        {reward.playerImage ? (
          <Image
            src={reward.playerImage}
            alt={reward.playerName}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/30">
            {reward.playerName.charAt(0)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[#FFD700]" />
          <span className="truncate text-sm font-bold text-white">
            {reward.playerName}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-white/50">
          {threshold?.label ?? reward.triggerType} &middot; {reward.statLine}
        </p>
        <p className="text-xs text-white/30">
          vs {reward.opponent} &middot; {gameDate}
        </p>
      </div>

      {/* Value */}
      <div className="shrink-0 text-right">
        <div className={cn(
          "text-sm font-bold",
          isRedeemed ? "text-white/30" : "text-[#FFD700]",
        )}>
          +{formatTokenAmount(reward.totalValue)}
        </div>
        {reward.cardsOwned > 1 && (
          <div className="text-xs text-white/30">
            {reward.cardsOwned} cards
          </div>
        )}
      </div>

      {/* Status indicator */}
      {isUnclaimed && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FFD700] animate-pulse" />
      )}
    </button>
  );
}
