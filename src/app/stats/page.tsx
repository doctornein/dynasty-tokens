import { BarChart3 } from "lucide-react";
import { StatsBoard } from "@/components/stats/StatsBoard";

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-[#FFD700]" />
        <div>
          <h1 className="text-2xl font-black text-white">Stats</h1>
          <p className="text-sm text-white/40">League leaders, arena MVPs &amp; reward power</p>
        </div>
      </div>

      <StatsBoard />
    </div>
  );
}
