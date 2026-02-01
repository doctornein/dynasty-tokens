"use client";

import { Player } from "@/types";
import { useTeamSchedule } from "@/hooks/usePlayerDetails";

interface ScheduleTabProps {
  player: Player;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ScheduleTab({ player }: ScheduleTabProps) {
  const { data, error, isLoading, mutate } = useTeamSchedule(player.teamAbbr);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-white/40">Failed to load schedule</p>
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
        No upcoming games scheduled
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {data.map((game) => (
        <a
          key={game.gameId}
          href={`https://www.espn.com/nba/game/_/gameId/${game.gameId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm">
              {game.isHome ? (
                <span className="text-xs font-semibold text-emerald-400">
                  vs
                </span>
              ) : (
                <span className="text-xs font-semibold text-white/30">@</span>
              )}
              <span className="font-medium text-white/80">
                {game.opponent}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-white/40">
              {formatDate(game.date)}
              {game.time !== "TBD" && ` · ${game.time}`}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase text-white/30">
              {game.isHome ? "Home" : "Away"}
            </div>
            <svg
              className="h-3.5 w-3.5 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
}
