"use client";

import { Player } from "@/types";
import { useRewardStore } from "@/stores/rewardStore";
import { formatTokenAmount } from "@/lib/formatters";
import { airdropThresholds } from "@/data/airdropThresholds";
import { Trophy, Inbox } from "lucide-react";

interface PlayerRewardsTabProps {
  player: Player;
}

export function PlayerRewardsTab({ player }: PlayerRewardsTabProps) {
  const getByPlayer = useRewardStore((s) => s.getByPlayer);
  const rewards = getByPlayer(player.id);

  const lifetimeEarned = rewards.reduce((sum, r) => sum + r.totalValue, 0);
  const unclaimed = rewards.filter((r) => r.status === "unclaimed");
  const claimed = rewards.filter((r) => r.status === "claimed");
  const redeemed = rewards.filter((r) => r.status === "redeemed");

  if (rewards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-white/30">
        <Inbox className="h-8 w-8" />
        <p className="text-sm">No rewards for this player yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Lifetime summary */}
      <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
        <Trophy className="h-5 w-5 text-[#FFD700]" />
        <span className="text-sm text-white/60">Lifetime Earned</span>
        <span className="ml-auto text-sm font-bold text-[#FFD700]">
          {formatTokenAmount(lifetimeEarned)}
        </span>
      </div>

      {/* Grouped by status */}
      {[
        { label: "Unclaimed", items: unclaimed },
        { label: "Claimed", items: claimed },
        { label: "Redeemed", items: redeemed },
      ]
        .filter(({ items }) => items.length > 0)
        .map(({ label, items }) => (
          <div key={label}>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">
              {label} ({items.length})
            </h4>
            <div className="space-y-1.5">
              {items.map((reward) => {
                const threshold = airdropThresholds.find(
                  (t) => t.type === reward.triggerType
                );
                const gameDate = new Date(reward.gameDate).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                );
                return (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-white/70">
                        {threshold?.label ?? reward.triggerType}
                      </span>
                      <span className="ml-2 text-white/30">
                        {gameDate} vs {reward.opponent}
                      </span>
                    </div>
                    <span className="font-bold text-[#FFD700]">
                      +{formatTokenAmount(reward.totalValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
