"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";

interface ArenaLeader {
  playerId: string;
  wins: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function headshotUrl(player: Player): string {
  if (player.nbaPersonId) {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${player.nbaPersonId}.png&w=96&h=70&cb=1`;
  }
  return player.image || "";
}

export function ArenaMVPs() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { data, isLoading } = useSWR<{ leaders: ArenaLeader[] }>(
    "/api/stats/arena-leaders",
    fetcher
  );

  const leaders = data?.leaders ?? [];
  const maxWins = leaders[0]?.wins ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-white/30">
        No settled arena matches yet. Play in the Arena to see leaders here.
      </div>
    );
  }

  return (
    <>
      <div>
        <p className="mb-5 text-xs text-white/40">
          Players with the most arena match wins.
        </p>

        <div className="space-y-1.5">
          {leaders.map((leader, i) => {
            const player = players.find((p) => p.id === leader.playerId);
            if (!player) return null;

            const barWidth = (leader.wins / maxWins) * 100;

            return (
              <button
                key={leader.playerId}
                onClick={() => setSelectedPlayer(player)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                {/* Rank */}
                <span className="w-6 shrink-0 text-center text-sm font-bold text-white/30">
                  {i + 1}
                </span>

                {/* Headshot */}
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/5">
                  {headshotUrl(player) && (
                    <Image
                      src={headshotUrl(player)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  )}
                </div>

                {/* Name + team */}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {player.name}
                  </div>
                  <div className="text-[11px] text-white/40">
                    {player.teamAbbr}
                  </div>
                </div>

                {/* Wins + bar */}
                <div className="w-28 shrink-0">
                  <div className="mb-0.5 text-right font-mono text-sm font-bold text-[#00D4FF]">
                    {leader.wins} {leader.wins === 1 ? "win" : "wins"}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#00D4FF]/60"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <PlayerCardModal
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={(open) => {
          if (!open) setSelectedPlayer(null);
        }}
      />
    </>
  );
}
