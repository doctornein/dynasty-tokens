"use client";

import { RewardsDashboard } from "@/components/rewards/RewardsDashboard";
import { Trophy } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-[#FFD700]" />
        <div>
          <h1 className="text-3xl font-bold text-white">Performance Rewards</h1>
          <p className="text-sm text-white/40">
            Earn DT when your players hit performance thresholds in real games
          </p>
        </div>
      </div>
      <RewardsDashboard />
    </div>
  );
}
