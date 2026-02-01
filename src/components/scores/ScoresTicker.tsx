"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Team {
  abbreviation: string;
  logo: string;
  score: string;
  homeAway: string;
  winner: boolean;
}

interface Game {
  id: string;
  state: string;
  detail: string;
  teams: Team[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function GameChip({ game }: { game: Game }) {
  const away = game.teams.find((t) => t.homeAway === "away");
  const home = game.teams.find((t) => t.homeAway === "home");
  if (!away || !home) return null;

  const isLive = game.state === "in";
  const isFinal = game.state === "post";
  const isPre = game.state === "pre";

  return (
    <Link
      href={`/scores?game=${game.id}`}
      className="flex shrink-0 items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 transition-colors hover:bg-white/[0.07]"
    >
      {/* Away team */}
      <div className="flex items-center gap-1.5">
        {away.logo && (
          <Image src={away.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
        )}
        <span className={`text-xs font-semibold ${isFinal && !away.winner ? "text-white/40" : "text-white"}`}>
          {away.abbreviation}
        </span>
        {!isPre && (
          <span className={`min-w-[20px] text-right font-mono text-xs ${isFinal && !away.winner ? "text-white/40" : "font-bold text-white"}`}>
            {away.score}
          </span>
        )}
      </div>

      {/* Divider / status */}
      <div className="flex flex-col items-center">
        {isLive ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-red-400">{game.detail}</span>
          </span>
        ) : isPre ? (
          <span className="text-[10px] text-white/40">{game.detail}</span>
        ) : (
          <span className="text-[10px] text-white/30">{game.detail}</span>
        )}
      </div>

      {/* Home team */}
      <div className="flex items-center gap-1.5">
        {!isPre && (
          <span className={`min-w-[20px] font-mono text-xs ${isFinal && !home.winner ? "text-white/40" : "font-bold text-white"}`}>
            {home.score}
          </span>
        )}
        <span className={`text-xs font-semibold ${isFinal && !home.winner ? "text-white/40" : "text-white"}`}>
          {home.abbreviation}
        </span>
        {home.logo && (
          <Image src={home.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
        )}
      </div>
    </Link>
  );
}

export function ScoresTicker() {
  const { data } = useSWR<{ events: Game[] }>(
    "/api/scores",
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <div className="relative z-50 border-b border-white/5 bg-[#070710]">
      <div className="flex items-center">
        {/* Label */}
        <div className="hidden shrink-0 border-r border-white/5 px-3 py-2 sm:block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">NBA</span>
        </div>

        {/* Scrollable games */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto px-2 py-1.5 scrollbar-none">
          {events.map((game) => (
            <GameChip key={game.id} game={game} />
          ))}
        </div>

        {/* See all link */}
        <Link
          href="/scores"
          className="hidden shrink-0 items-center gap-1 border-l border-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-white sm:flex"
        >
          All Scores
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
