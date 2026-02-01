"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PerformanceReward } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";

interface RewardStore {
  rewards: PerformanceReward[];
  lastScanAt: string | null;
  isScanning: boolean;

  detect: (newRewards: PerformanceReward[]) => void;
  claim: (id: string) => void;
  claimAll: () => void;
  redeem: (ids: string[]) => Promise<boolean>;
  redeemAll: () => Promise<boolean>;
  getByStatus: (status: PerformanceReward["status"]) => PerformanceReward[];
  getByPlayer: (playerId: string) => PerformanceReward[];
  getUnclaimedCount: () => number;
  getClaimedValue: () => number;
  getTotalEarned: () => number;
  setScanning: (v: boolean) => void;
  setLastScanAt: (ts: string) => void;
}

export const useRewardStore = create<RewardStore>()(
  persist(
    (set, get) => ({
      rewards: [],
      lastScanAt: null,
      isScanning: false,

      detect: (newRewards: PerformanceReward[]) => {
        const existing = get().rewards;
        const existingIds = new Set(existing.map((r) => r.id));
        const unique = newRewards.filter((r) => !existingIds.has(r.id));
        if (unique.length === 0) return;
        set({ rewards: [...existing, ...unique] });
      },

      claim: (id: string) => {
        set({
          rewards: get().rewards.map((r) =>
            r.id === id && r.status === "unclaimed"
              ? { ...r, status: "claimed" as const, claimedAt: new Date().toISOString() }
              : r
          ),
        });
      },

      claimAll: () => {
        const now = new Date().toISOString();
        set({
          rewards: get().rewards.map((r) =>
            r.status === "unclaimed"
              ? { ...r, status: "claimed" as const, claimedAt: now }
              : r
          ),
        });
      },

      redeem: async (ids: string[]) => {
        const rewards = get().rewards;
        const toRedeem = rewards.filter(
          (r) => ids.includes(r.id) && r.status === "claimed"
        );
        if (toRedeem.length === 0) return false;

        const totalValue = toRedeem.reduce((sum, r) => sum + r.totalValue, 0);

        const supabase = createClient();
        const { data, error } = await supabase.rpc("add_balance", {
          p_amount: totalValue,
          p_description: `Redeemed ${totalValue.toLocaleString()} DT from ${toRedeem.length} reward${toRedeem.length > 1 ? "s" : ""}`,
          p_type: "reward_redeem",
        });

        if (error || !data?.success) return false;

        await useAuthStore.getState().refreshProfile();

        const now = new Date().toISOString();
        const redeemSet = new Set(ids);
        set({
          rewards: rewards.map((r) =>
            redeemSet.has(r.id) && r.status === "claimed"
              ? { ...r, status: "redeemed" as const, redeemedAt: now }
              : r
          ),
        });
        return true;
      },

      redeemAll: async () => {
        const claimed = get().rewards.filter((r) => r.status === "claimed");
        if (claimed.length === 0) return false;
        return get().redeem(claimed.map((r) => r.id));
      },

      getByStatus: (status) => get().rewards.filter((r) => r.status === status),

      getByPlayer: (playerId) => get().rewards.filter((r) => r.playerId === playerId),

      getUnclaimedCount: () => get().rewards.filter((r) => r.status === "unclaimed").length,

      getClaimedValue: () =>
        get()
          .rewards.filter((r) => r.status === "claimed")
          .reduce((sum, r) => sum + r.totalValue, 0),

      getTotalEarned: () => get().rewards.reduce((sum, r) => sum + r.totalValue, 0),

      setScanning: (v: boolean) => set({ isScanning: v }),
      setLastScanAt: (ts: string) => set({ lastScanAt: ts }),
    }),
    {
      name: "dynasty-rewards",
      partialize: (state) => ({
        rewards: state.rewards,
        lastScanAt: state.lastScanAt,
      }),
    }
  )
);
