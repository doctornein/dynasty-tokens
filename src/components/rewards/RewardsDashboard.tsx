"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRewardStore } from "@/stores/rewardStore";
import { useRewardScan } from "@/hooks/useRewardScan";
import { ScanStatusBar } from "./ScanStatusBar";
import { RewardsSummaryCards } from "./RewardsSummaryCards";
import { RewardsGuide } from "./RewardsGuide";
import { RewardBadge } from "./RewardBadge";
import { RedemptionArea } from "./RedemptionArea";
import { GlowButton } from "@/components/ui/GlowButton";
import { Inbox, Loader2 } from "lucide-react";

type Tab = "unclaimed" | "claimed" | "redeemed";

export function RewardsDashboard() {
  const connected = useAuthStore((s) => s.isAuthenticated());
  const {
    rewards, getUnclaimedCount, getClaimedValue, getTotalEarned,
    getByStatus, claim, claimAll,
  } = useRewardStore();
  const { scan, isScanning, lastScanAt, playerCount } = useRewardScan();
  const [activeTab, setActiveTab] = useState<Tab>("unclaimed");

  if (!connected) {
    return (
      <div className="py-20 text-center text-white/40">
        Sign in to view rewards.
      </div>
    );
  }

  const unclaimedCount = getUnclaimedCount();
  const claimableValue = getClaimedValue();
  const lifetimeEarned = getTotalEarned();

  const unclaimed = getByStatus("unclaimed");
  const claimed = getByStatus("claimed");
  const redeemed = getByStatus("redeemed");

  const unclaimedValue = unclaimed.reduce((s, r) => s + r.totalValue, 0);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "unclaimed", label: "Unclaimed", count: unclaimed.length },
    { key: "claimed", label: "Claimed", count: claimed.length },
    { key: "redeemed", label: "Trophy Cabinet", count: redeemed.length },
  ];

  return (
    <div>
      <ScanStatusBar
        isScanning={isScanning}
        lastScanAt={lastScanAt}
        playerCount={playerCount}
        onScan={scan}
      />

      <RewardsSummaryCards
        unclaimedCount={unclaimedCount}
        claimableValue={claimableValue}
        lifetimeEarned={lifetimeEarned}
      />

      <RewardsGuide />

      {/* Tab bar */}
      <div className="mb-4 flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-white/80 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Unclaimed tab */}
      {activeTab === "unclaimed" && (
        <div>
          {unclaimed.length > 0 && (
            <div className="mb-4 flex justify-end">
              <GlowButton variant="gold" size="sm" onClick={claimAll}>
                Claim All ({unclaimed.length})
              </GlowButton>
            </div>
          )}
          {isScanning && unclaimed.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-white/30">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Scanning for rewards...</p>
            </div>
          )}
          {!isScanning && unclaimed.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-white/30">
              <Inbox className="h-10 w-10" />
              <p className="max-w-sm text-center text-sm">
                No unclaimed rewards. Open packs to collect player cards, then rewards will
                appear when players hit performance thresholds in real games.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {unclaimed.map((reward) => (
              <RewardBadge
                key={reward.id}
                reward={reward}
                onToggle={() => claim(reward.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claimed tab */}
      {activeTab === "claimed" && (
        <RedemptionArea claimedRewards={claimed} />
      )}

      {/* Redeemed archive tab */}
      {activeTab === "redeemed" && (
        <div>
          {redeemed.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-white/30">
              <Inbox className="h-10 w-10" />
              <p className="text-sm">No redeemed rewards yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {redeemed.map((reward) => (
                <RewardBadge key={reward.id} reward={reward} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
