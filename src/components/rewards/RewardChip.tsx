"use client";

import { useRewardStore } from "@/stores/rewardStore";
import { Trophy } from "lucide-react";

export function RewardChip() {
  const unclaimedCount = useRewardStore((s) => s.getUnclaimedCount());

  if (unclaimedCount <= 0) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
      <Trophy className="h-3.5 w-3.5 text-emerald-400" />
      <span className="text-xs font-bold text-emerald-400">
        {unclaimedCount}
      </span>
    </div>
  );
}
