"use client";

import { ArenaMatch } from "@/types";
import { players } from "@/data/players";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ArenaMatchStatusBadge } from "./ArenaMatchStatusBadge";
import { formatTokenAmount } from "@/lib/formatters";
import { Swords, Calendar, Lock } from "lucide-react";

interface ArenaChallengeCardProps {
  match: ArenaMatch;
  onClick: () => void;
}

const gameTypeLabel: Record<string, string> = {
  "1v1": "1v1",
  "3v3": "3v3",
  "5v5": "5v5",
};

export function ArenaChallengeCard({ match, onClick }: ArenaChallengeCardProps) {
  const challengerPlayers = match.challengerCards
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div onClick={onClick}>
    <GlassPanel hover className="cursor-pointer p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
            {gameTypeLabel[match.gameType]}
          </span>
          <ArenaMatchStatusBadge status={match.status} />
        </div>
        {match.invitedUsername && (
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Lock className="h-3 w-3" />
            {match.invitedUsername}
          </div>
        )}
      </div>

      {/* Stat categories */}
      <div className="mb-3 flex flex-wrap gap-1">
        {match.statCategories.map((cat) => (
          <span
            key={cat}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Challenger lineup */}
      <div className="mb-3">
        <div className="mb-1 text-[10px] text-white/30">Challenger</div>
        <div className="text-sm font-medium text-white">
          {match.challengerUsername}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {challengerPlayers.map((p) => (
            <span
              key={p!.id}
              className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60"
            >
              {p!.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: wager + dates */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <Swords className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-400">
            {formatTokenAmount(match.wager)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/30">
          <Calendar className="h-3 w-3" />
          {match.startDate} — {match.endDate}
        </div>
      </div>
    </GlassPanel>
    </div>
  );
}
