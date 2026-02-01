"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";

interface Team {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  score: string;
  homeAway: string;
  winner: boolean;
  records?: string[];
  topScorer?: { name: string; value: string };
}

interface Game {
  id: string;
  date: string;
  name: string;
  shortName: string;
  state: string;
  detail: string;
  period: number;
  clock: string;
  teams: Team[];
}

// ESPN uses shortened abbreviations for some teams
const ABBR_MAP: Record<string, string> = {
  GS: "GSW",
  SA: "SAS",
  NY: "NYK",
  NO: "NOP",
};

function normalizeAbbr(abbr: string): string {
  return ABBR_MAP[abbr] || abbr;
}

function getTeamPlayers(teamAbbr: string): Player[] {
  const normalized = normalizeAbbr(teamAbbr);
  return players
    .filter((p) => p.teamAbbr === normalized)
    .sort((a, b) => b.overallRating - a.overallRating)
    .slice(0, 5);
}

function headshotUrl(player: Player): string {
  if (player.nbaPersonId) {
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${player.nbaPersonId}.png&w=96&h=70&cb=1`;
  }
  return player.image || "";
}

interface GamePreviewProps {
  game: Game;
}

export function GamePreview({ game }: GamePreviewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerClick = useCallback((player: Player) => {
    setSelectedPlayer(player);
  }, []);

  const away = game.teams.find((t) => t.homeAway === "away");
  const home = game.teams.find((t) => t.homeAway === "home");

  const awayPlayers = useMemo(
    () => (away ? getTeamPlayers(away.abbreviation) : []),
    [away]
  );
  const homePlayers = useMemo(
    () => (home ? getTeamPlayers(home.abbreviation) : []),
    [home]
  );

  if (!away || !home) return null;

  return (
    <>
      <div className="divide-y divide-white/5 px-4 py-4">
        {/* Away team roster */}
        <TeamRoster
          team={away}
          players={awayPlayers}
          onPlayerClick={handlePlayerClick}
        />

        {/* Home team roster */}
        <TeamRoster
          team={home}
          players={homePlayers}
          onPlayerClick={handlePlayerClick}
        />

        {awayPlayers.length === 0 && homePlayers.length === 0 && (
          <div className="py-8 text-center text-xs text-white/30">
            No player data available for this matchup
          </div>
        )}
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

function TeamRoster({
  team,
  players: teamPlayers,
  onPlayerClick,
}: {
  team: Team;
  players: Player[];
  onPlayerClick: (player: Player) => void;
}) {
  if (teamPlayers.length === 0) return null;

  return (
    <div className="py-3">
      <div className="mb-3 flex items-center gap-2">
        {team.logo && (
          <Image
            src={team.logo}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
        )}
        <span className="text-xs font-bold text-white">
          {team.displayName}
        </span>
        <span className="text-[10px] text-white/30">Key Players</span>
      </div>

      <div className="space-y-1">
        {teamPlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => onPlayerClick(player)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
          >
            {/* Headshot */}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/5">
              {headshotUrl(player) && (
                <Image
                  src={headshotUrl(player)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              )}
            </div>

            {/* Name + position */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {player.name}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <span>{player.position}</span>
                <span>#{player.jerseyNumber}</span>
                <span className="text-white/20">
                  {player.overallRating} OVR
                </span>
              </div>
            </div>

            {/* Season averages */}
            <div className="flex shrink-0 items-center gap-3 text-right">
              <div>
                <div className="font-mono text-xs font-bold text-white">
                  {player.stats.ppg.toFixed(1)}
                </div>
                <div className="text-[9px] uppercase text-white/30">PPG</div>
              </div>
              <div>
                <div className="font-mono text-xs text-white/70">
                  {player.stats.rpg.toFixed(1)}
                </div>
                <div className="text-[9px] uppercase text-white/30">RPG</div>
              </div>
              <div>
                <div className="font-mono text-xs text-white/70">
                  {player.stats.apg.toFixed(1)}
                </div>
                <div className="text-[9px] uppercase text-white/30">APG</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
