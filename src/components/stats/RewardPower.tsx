"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";

function computeRewardPower(player: Player): number {
  const { ppg, rpg, apg, spg, bpg } = player.stats;
  let score = 0;

  // PPG tiers
  if (ppg >= 30) score += 40;
  else if (ppg >= 25) score += 25;
  else if (ppg >= 20) score += 15;

  // RPG tiers
  if (rpg >= 10) score += 15;
  else if (rpg >= 7) score += 8;

  // APG tiers
  if (apg >= 8) score += 15;
  else if (apg >= 5) score += 8;

  // SPG
  if (spg >= 2) score += 10;

  // BPG
  if (bpg >= 2) score += 10;

  // Multi-stat bonuses
  const cats10 = [ppg, rpg, apg].filter((v) => v >= 10).length;
  if (cats10 >= 3) score += 25;
  else if (cats10 >= 2) score += 15;

  return score;
}

function headshotUrl(player: Player): string {
  if (player.nbaPersonId) {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${player.nbaPersonId}.png&w=96&h=70&cb=1`;
  }
  return player.image || "";
}

interface RankedPlayer {
  player: Player;
  score: number;
}

export function RewardPower() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const ranked: RankedPlayer[] = useMemo(() => {
    return players
      .map((p) => ({ player: p, score: computeRewardPower(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, []);

  const maxScore = ranked[0]?.score ?? 1;

  return (
    <>
      <div>
        <p className="mb-5 text-xs text-white/40">
          Estimated reward trigger frequency based on season averages.
        </p>

        <div className="space-y-1.5">
          {ranked.map(({ player, score }, i) => {
            const barWidth = (score / maxScore) * 100;

            return (
              <button
                key={player.id}
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
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <span>{player.teamAbbr}</span>
                  </div>
                </div>

                {/* Stat badges */}
                <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                    {player.stats.ppg.toFixed(1)} PPG
                  </span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                    {player.stats.rpg.toFixed(1)} RPG
                  </span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
                    {player.stats.apg.toFixed(1)} APG
                  </span>
                </div>

                {/* Score + bar */}
                <div className="w-24 shrink-0">
                  <div className="mb-0.5 text-right font-mono text-sm font-bold text-[#8B5CF6]">
                    {score}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#8B5CF6]/60"
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
