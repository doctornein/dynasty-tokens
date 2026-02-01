"use client";

import { Gift, TrendingUp, Trophy } from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";

interface RewardsSummaryCardsProps {
  unclaimedCount: number;
  claimableValue: number;
  lifetimeEarned: number;
}

export function RewardsSummaryCards({ unclaimedCount, claimableValue, lifetimeEarned }: RewardsSummaryCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <Gift className="h-8 w-8 text-[#FFD700]" />
        <div>
          <div className="text-2xl font-bold text-white">{unclaimedCount}</div>
          <div className="text-xs text-white/40">Unclaimed Rewards</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <Trophy className="h-8 w-8 text-emerald-400" />
        <div>
          <div className="text-2xl font-bold text-white">{formatTokenAmount(claimableValue)}</div>
          <div className="text-xs text-white/40">Claimable DT</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <TrendingUp className="h-8 w-8 text-blue-400" />
        <div>
          <div className="text-2xl font-bold text-white">{formatTokenAmount(lifetimeEarned)}</div>
          <div className="text-xs text-white/40">Lifetime Earned</div>
        </div>
      </div>
    </div>
  );
}
