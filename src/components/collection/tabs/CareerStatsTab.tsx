"use client";

import { Player } from "@/types";
import { useCareerStats } from "@/hooks/usePlayerDetails";

interface CareerStatsTabProps {
  player: Player;
}

function formatSeason(year: number) {
  const next = (year + 1) % 100;
  return `${year}-${String(next).padStart(2, "0")}`;
}

export function CareerStatsTab({ player }: CareerStatsTabProps) {
  const { data, error, isLoading, mutate } = useCareerStats(player.image);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-white/40">Failed to load career stats</p>
        <button
          onClick={() => mutate()}
          className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/15"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-white/40">
        No career data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-white/40">
            <th className="sticky left-0 bg-[#12121a] px-2 py-2 text-left font-medium">
              Season
            </th>
            <th className="px-2 py-2 text-right font-medium">GP</th>
            <th className="px-2 py-2 text-right font-medium">MPG</th>
            <th className="px-2 py-2 text-right font-medium">PPG</th>
            <th className="px-2 py-2 text-right font-medium">RPG</th>
            <th className="px-2 py-2 text-right font-medium">APG</th>
            <th className="px-2 py-2 text-right font-medium">SPG</th>
            <th className="px-2 py-2 text-right font-medium">BPG</th>
            <th className="px-2 py-2 text-right font-medium">FG%</th>
            <th className="px-2 py-2 text-right font-medium">3P%</th>
            <th className="px-2 py-2 text-right font-medium">FT%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((season) => {
            const isCurrent = season.season === player.season;
            return (
              <tr
                key={season.season}
                className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                  isCurrent ? "bg-white/[0.03]" : ""
                }`}
              >
                <td
                  className={`sticky left-0 bg-[#12121a] whitespace-nowrap px-2 py-1.5 font-medium ${
                    isCurrent ? "text-white" : "text-white/60"
                  }`}
                >
                  {formatSeason(season.season)}
                  {isCurrent && (
                    <span className="ml-1 text-[9px] text-white/30">*</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.gamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.mpg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right font-medium text-white">
                  {season.ppg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/70">
                  {season.rpg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/70">
                  {season.apg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.spg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.bpg.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.fgPct.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.fg3Pct.toFixed(1)}
                </td>
                <td className="px-2 py-1.5 text-right text-white/50">
                  {season.ftPct.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
