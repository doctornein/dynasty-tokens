"use client";

import { useMemo } from "react";
import { Player, GameLogEntry, AirdropTriggerType } from "@/types";
import { useFullGameLog } from "@/hooks/usePlayerDetails";
import { airdropThresholds } from "@/data/airdropThresholds";
import { Trophy, Inbox, Loader2 } from "lucide-react";

interface CareerRewardsTabProps {
  player: Player;
}

interface RewardCount {
  type: AirdropTriggerType;
  label: string;
  description: string;
  count: number;
  baseValue: number;
}

function computeRewardCounts(games: GameLogEntry[]): RewardCount[] {
  const counts = new Map<AirdropTriggerType, number>();

  for (const game of games) {
    for (const threshold of airdropThresholds) {
      if (threshold.detect(game)) {
        counts.set(threshold.type, (counts.get(threshold.type) ?? 0) + 1);
      }
    }
  }

  return airdropThresholds
    .filter((t) => counts.has(t.type))
    .map((t) => ({
      type: t.type,
      label: t.label,
      description: t.description,
      count: counts.get(t.type) ?? 0,
      baseValue: t.baseValue,
    }));
}

export function CareerRewardsTab({ player }: CareerRewardsTabProps) {
  const { data: games, isLoading, error } = useFullGameLog(player.image);

  const rewards = useMemo(() => {
    if (!games) return [];
    return computeRewardCounts(games);
  }, [games]);

  const totalRewards = rewards.reduce((sum, r) => sum + r.count, 0);
  const totalValue = rewards.reduce((sum, r) => sum + r.count * r.baseValue, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-white/30">
        Failed to load reward data
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-white/30">
        <Inbox className="h-8 w-8" />
        <p className="text-sm">No performance rewards triggered this season.</p>
        <p className="text-xs text-white/20">
          {games?.length ?? 0} games analyzed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Season summary */}
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Trophy className="h-5 w-5 shrink-0 text-[#FFD700]" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">
            {totalRewards} Rewards Triggered
          </div>
          <div className="text-xs text-white/40">
            {games?.length ?? 0} games this season &middot;{" "}
            {totalValue.toFixed(2)} DT base value generated
          </div>
        </div>
      </div>

      {/* Reward breakdown */}
      <div className="space-y-1.5">
        {rewards.map((reward) => (
          <div
            key={reward.type}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white/80">
                {reward.label}
              </div>
              <div className="truncate text-[10px] text-white/30">
                {reward.description}
              </div>
            </div>
            <div className="ml-3 shrink-0 text-right">
              <div className="text-sm font-bold text-[#FFD700]">
                {reward.count}x
              </div>
              <div className="text-[10px] text-white/30">
                {(reward.count * reward.baseValue).toFixed(2)} DT
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-white/20">
        Based on {games?.length ?? 0} regular season games &middot; Base values
        shown (holders earn multiplied rewards)
      </p>
    </div>
  );
}
