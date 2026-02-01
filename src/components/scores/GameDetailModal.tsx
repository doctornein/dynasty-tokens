"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { BoxScore } from "./BoxScore";
import { GamePreview } from "./GamePreview";

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

interface GameDetailModalProps {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameDetailModal({ game, open, onOpenChange }: GameDetailModalProps) {
  if (!game) return null;

  const away = game.teams.find((t) => t.homeAway === "away");
  const home = game.teams.find((t) => t.homeAway === "home");
  const isPre = game.state === "pre";
  const isLive = game.state === "in";
  const isFinal = game.state === "post";

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-4xl p-0">
      <div className="flex max-h-[85vh] flex-col">
        {/* Game header */}
        <div className="shrink-0 border-b border-white/10 px-6 pb-4 pt-5">
          {/* Status */}
          <div className="mb-4 text-center">
            {isLive ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-400">{game.detail}</span>
              </div>
            ) : (
              <span className={`text-xs font-semibold ${isFinal ? "text-white/40" : "text-[#FFD700]"}`}>
                {game.detail}
              </span>
            )}
          </div>

          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-6">
            {/* Away team */}
            {away && (
              <div className={`flex items-center gap-3 ${isFinal && !away.winner ? "opacity-50" : ""}`}>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{away.displayName}</div>
                  {away.records?.[0] && (
                    <div className="text-[11px] text-white/30">{away.records[0]}</div>
                  )}
                </div>
                <div className="relative h-10 w-10 shrink-0">
                  {away.logo && (
                    <Image src={away.logo} alt="" fill className="object-contain" sizes="40px" />
                  )}
                </div>
                {!isPre && (
                  <span className="min-w-[48px] text-center font-mono text-2xl font-black text-white">
                    {away.score}
                  </span>
                )}
              </div>
            )}

            <span className="text-sm font-bold text-white/20">vs</span>

            {/* Home team */}
            {home && (
              <div className={`flex items-center gap-3 ${isFinal && !home.winner ? "opacity-50" : ""}`}>
                {!isPre && (
                  <span className="min-w-[48px] text-center font-mono text-2xl font-black text-white">
                    {home.score}
                  </span>
                )}
                <div className="relative h-10 w-10 shrink-0">
                  {home.logo && (
                    <Image src={home.logo} alt="" fill className="object-contain" sizes="40px" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{home.displayName}</div>
                  {home.records?.[0] && (
                    <div className="text-[11px] text-white/30">{home.records[0]}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isPre ? <GamePreview game={game} /> : <BoxScore gameId={game.id} modal />}
        </div>
      </div>
    </Modal>
  );
}
