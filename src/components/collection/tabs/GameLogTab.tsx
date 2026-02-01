"use client";

import { Player } from "@/types";
import { useGameLog } from "@/hooks/usePlayerDetails";

interface GameLogTabProps {
  player: Player;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GameLogTab({ player }: GameLogTabProps) {
  const { data, error, isLoading, mutate } = useGameLog(player.image, player.season);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-white/40">Failed to load game log</p>
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
        No game data available this season
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-white/40">
            <th className="sticky left-0 bg-[#12121a] px-2 py-2 text-left font-medium">
              Date
            </th>
            <th className="px-2 py-2 text-left font-medium">Opp</th>
            <th className="px-2 py-2 text-right font-medium">MIN</th>
            <th className="px-2 py-2 text-right font-medium">PTS</th>
            <th className="px-2 py-2 text-right font-medium">REB</th>
            <th className="px-2 py-2 text-right font-medium">AST</th>
            <th className="px-2 py-2 text-right font-medium">STL</th>
            <th className="px-2 py-2 text-right font-medium">BLK</th>
            <th className="px-2 py-2 text-right font-medium">FG%</th>
            <th className="px-2 py-2 text-right font-medium">3P%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((game, i) => (
            <tr
              key={i}
              className="border-b border-white/5 transition-colors hover:bg-white/5"
            >
              <td className="sticky left-0 bg-[#12121a] whitespace-nowrap px-2 py-1.5 text-white/60">
                {formatDate(game.date)}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5">
                <span className="text-white/30">
                  {game.isHome ? "vs" : "@"}{" "}
                </span>
                <span className="text-white/70">{game.opponentAbbr}</span>
              </td>
              <td className="px-2 py-1.5 text-right text-white/50">
                {game.min}
              </td>
              <td className="px-2 py-1.5 text-right font-medium text-white">
                {game.pts}
              </td>
              <td className="px-2 py-1.5 text-right text-white/70">
                {game.reb}
              </td>
              <td className="px-2 py-1.5 text-right text-white/70">
                {game.ast}
              </td>
              <td className="px-2 py-1.5 text-right text-white/50">
                {game.stl}
              </td>
              <td className="px-2 py-1.5 text-right text-white/50">
                {game.blk}
              </td>
              <td className="px-2 py-1.5 text-right text-white/50">
                {game.fgPct.toFixed(1)}
              </td>
              <td className="px-2 py-1.5 text-right text-white/50">
                {game.fg3Pct.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
