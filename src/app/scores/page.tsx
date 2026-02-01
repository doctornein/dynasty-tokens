"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { GameDetailModal } from "@/components/scores/GameDetailModal";

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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function displayDate(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = date.toDateString();
  if (d === today.toDateString()) return "Today";
  if (d === yesterday.toDateString()) return "Yesterday";
  if (d === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function GameCard({
  game,
  onOpenBoxScore,
}: {
  game: Game;
  onOpenBoxScore: () => void;
}) {
  const away = game.teams.find((t) => t.homeAway === "away");
  const home = game.teams.find((t) => t.homeAway === "home");
  if (!away || !home) return null;

  const isLive = game.state === "in";
  const isFinal = game.state === "post";
  const isPre = game.state === "pre";

  const handleClick = () => {
    onOpenBoxScore();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
      <button
        onClick={handleClick}
        className="w-full px-4 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        {/* Status bar */}
        <div className="mb-3 flex items-center justify-between">
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-400">{game.detail}</span>
            </div>
          ) : (
            <span
              className={`text-xs font-medium ${isFinal ? "text-white/40" : "text-[#FFD700]"}`}
            >
              {game.detail}
            </span>
          )}
          <span className="text-[10px] text-white/30">
            {isPre ? "Preview" : "Box score"}
          </span>
        </div>

        {/* Away team row */}
        <div className={`flex items-center gap-3 ${isFinal && !away.winner ? "opacity-50" : ""}`}>
          <div className="relative h-8 w-8 shrink-0">
            {away.logo && (
              <Image src={away.logo} alt="" fill className="object-contain" sizes="32px" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{away.displayName}</div>
            {away.records?.[0] && (
              <div className="text-[11px] text-white/30">{away.records[0]}</div>
            )}
          </div>
          {!isPre && (
            <span className="min-w-[32px] text-right font-mono text-lg font-bold text-white">
              {away.score}
            </span>
          )}
        </div>

        {/* Home team row */}
        <div className={`mt-2 flex items-center gap-3 ${isFinal && !home.winner ? "opacity-50" : ""}`}>
          <div className="relative h-8 w-8 shrink-0">
            {home.logo && (
              <Image src={home.logo} alt="" fill className="object-contain" sizes="32px" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{home.displayName}</div>
            {home.records?.[0] && (
              <div className="text-[11px] text-white/30">{home.records[0]}</div>
            )}
          </div>
          {!isPre && (
            <span className="min-w-[32px] text-right font-mono text-lg font-bold text-white">
              {home.score}
            </span>
          )}
        </div>

        {/* Top scorers */}
        {(away.topScorer || home.topScorer) && (
          <div className="mt-3 flex gap-4 border-t border-white/5 pt-2 text-[11px] text-white/40">
            {away.topScorer && (
              <span>
                {away.topScorer.name} {away.topScorer.value}
              </span>
            )}
            {home.topScorer && (
              <span>
                {home.topScorer.name} {home.topScorer.value}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

export default function ScoresPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalGame, setModalGame] = useState<Game | null>(null);

  const dateStr = formatDate(selectedDate);
  const { data, isLoading } = useSWR<{ events: Game[] }>(
    `/api/scores?date=${dateStr}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const events = data?.events ?? [];
  const hasLive = events.some((e) => e.state === "in");

  const shiftDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">NBA Scores</h1>
        <p className="text-sm text-white/40">Live scores, schedules &amp; box scores</p>
      </div>

      {/* Date picker */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <button
          onClick={() => shiftDate(-1)}
          className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + (i - 3));
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <button
              key={i}
              onClick={() => {
                setSelectedDate(d);
              }}
              className={`rounded-lg px-3 py-2 text-center transition-colors ${
                isSelected
                  ? "bg-[#FFD700]/10 text-[#FFD700]"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={`text-sm font-bold ${isToday && !isSelected ? "text-white/70" : ""}`}>
                {d.getDate()}
              </div>
            </button>
          );
        })}

        <button
          onClick={() => shiftDate(1)}
          className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Live indicator */}
      {hasLive && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-400">Live games in progress</span>
          <span className="text-[10px] text-red-400/50">Auto-refreshing</span>
        </div>
      )}

      {/* Games list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center text-sm text-white/30">
          No games scheduled for {displayDate(selectedDate)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onOpenBoxScore={() => setModalGame(game)}
            />
          ))}
        </div>
      )}

      {/* Game detail modal */}
      <GameDetailModal
        game={modalGame}
        open={!!modalGame}
        onOpenChange={(open) => {
          if (!open) setModalGame(null);
        }}
      />
    </div>
  );
}
