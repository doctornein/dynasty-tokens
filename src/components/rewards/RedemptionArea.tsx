"use client";

import { useState } from "react";
import type { PerformanceReward } from "@/types";
import { GlowButton } from "@/components/ui/GlowButton";
import { RewardBadge } from "./RewardBadge";
import { RedemptionAnimation } from "./RedemptionAnimation";
import { formatTokenAmount } from "@/lib/formatters";
import { useRewardStore } from "@/stores/rewardStore";
import { ArrowRight, Check } from "lucide-react";

interface RedemptionAreaProps {
  claimedRewards: PerformanceReward[];
}

export function RedemptionArea({ claimedRewards }: RedemptionAreaProps) {
  const redeem = useRewardStore((s) => s.redeem);
  const redeemAll = useRewardStore((s) => s.redeemAll);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationValue, setAnimationValue] = useState(0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedValue = claimedRewards
    .filter((r) => selectedIds.has(r.id))
    .reduce((sum, r) => sum + r.totalValue, 0);

  const totalClaimedValue = claimedRewards.reduce((sum, r) => sum + r.totalValue, 0);

  const handleRedeem = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const value = selectedValue;
    const ok = await redeem(ids);
    if (ok) {
      setAnimationValue(value);
      setShowAnimation(true);
      setSelectedIds(new Set());
    }
  };

  const handleRedeemAll = async () => {
    const value = totalClaimedValue;
    const ok = await redeemAll();
    if (ok) {
      setAnimationValue(value);
      setShowAnimation(true);
      setSelectedIds(new Set());
    }
  };

  if (claimedRewards.length === 0) return null;

  return (
    <div className="mb-8">
      {showAnimation && (
        <RedemptionAnimation
          value={animationValue}
          onComplete={() => setShowAnimation(false)}
        />
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">
          Claimed &mdash; Ready to Redeem
        </h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <GlowButton variant="gold" size="sm" onClick={handleRedeem}>
              <span className="flex items-center gap-1">
                Redeem {formatTokenAmount(selectedValue)} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </GlowButton>
          )}
          <GlowButton variant="blue" size="sm" onClick={handleRedeemAll}>
            Redeem All ({formatTokenAmount(totalClaimedValue)})
          </GlowButton>
        </div>
      </div>

      <div className="space-y-2">
        {claimedRewards.map((reward) => (
          <RewardBadge
            key={reward.id}
            reward={reward}
            selected={selectedIds.has(reward.id)}
            onToggle={() => toggleSelect(reward.id)}
          />
        ))}
      </div>
    </div>
  );
}
