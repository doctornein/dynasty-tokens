"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";

type StatKey = "ppg" | "rpg" | "apg" | "spg" | "bpg" | "fgPct" | "fg3Pct";

const STAT_CATEGORIES: { key: StatKey; label: string; suffix: string }[] = [
  { key: "ppg", label: "PPG", suffix: "" },
  { key: "rpg", label: "RPG", suffix: "" },
  { key: "apg", label: "APG", suffix: "" },
  { key: "spg", label: "SPG", suffix: "" },
  { key: "bpg", label: "BPG", suffix: "" },
  { key: "fgPct", label: "FG%", suffix: "%" },
  { key: "fg3Pct", label: "3P%", suffix: "%" },
];

function headshotUrl(player: Player): string {
  if (player.nbaPersonId) {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${player.nbaPersonId}.png&w=96&h=70&cb=1`;
  }
  return player.image || "";
}

export function LeagueLeaders() {
  const [selectedStat, setSelectedStat] = useState<StatKey>("ppg");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const category = STAT_CATEGORIES.find((c) => c.key === selectedStat)!;

  const leaders = useMemo(() => {
    return [...players]
      .sort((a, b) => b.stats[selectedStat] - a.stats[selectedStat])
      .slice(0, 10);
  }, [selectedStat]);

  const maxStat = leaders[0]?.stats[selectedStat] ?? 1;

  return (
    <>
      <div>
        {/* Category chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {STAT_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedStat(cat.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedStat === cat.key
                  ? "bg-[#FFD700]/15 text-[#FFD700]"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="space-y-1.5">
          {leaders.map((player, i) => {
            const value = player.stats[selectedStat];
            const barWidth = (value / maxStat) * 100;
            const displayValue =
              category.suffix === "%"
                ? (value * 100).toFixed(1) + "%"
                : value.toFixed(1);

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
                  <div className="text-[11px] text-white/40">
                    {player.teamAbbr}
                  </div>
                </div>

                {/* Value + bar */}
                <div className="w-32 shrink-0">
                  <div className="mb-0.5 text-right font-mono text-sm font-bold text-white">
                    {displayValue}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-[#FFD700]/60"
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
