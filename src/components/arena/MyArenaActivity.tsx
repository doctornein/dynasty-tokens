"use client";

import { useEffect, useState } from "react";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { ArenaMatch } from "@/types";
import { players } from "@/data/players";
import { formatTokenAmount } from "@/lib/formatters";
import { ArenaMatchStatusBadge } from "./ArenaMatchStatusBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Swords } from "lucide-react";

type Tab = "active" | "history";

interface MyArenaActivityProps {
  onSelectMatch: (match: ArenaMatch) => void;
}

export function MyArenaActivity({ onSelectMatch }: MyArenaActivityProps) {
  const [tab, setTab] = useState<Tab>("active");
  const { myMatches, fetchMyMatches } = useArenaStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyMatches();
    }
  }, [isAuthenticated, fetchMyMatches]);

  if (!isAuthenticated) {
    return (
      <div className="py-12 text-center text-sm text-white/40">
        Sign in to view your arena activity
      </div>
    );
  }

  const activeMatches = myMatches.filter(
    (m) => m.status === "open" || m.status === "matched"
  );
  const historyMatches = myMatches.filter(
    (m) => m.status === "settled" || m.status === "voided" || m.status === "cancelled"
  );

  const items = tab === "active" ? activeMatches : historyMatches;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-orange-500/20 text-orange-400"
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          Active ({activeMatches.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "history"
              ? "bg-orange-500/20 text-orange-400"
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          History ({historyMatches.length})
        </button>
      </div>

      {items.length === 0 && (
        <div className="py-12 text-center text-sm text-white/40">
          {tab === "active"
            ? "No active matches"
            : "No match history yet"}
        </div>
      )}

      <div className="space-y-2">
        {items.map((match) => (
          <ArenaActivityRow
            key={match.id}
            match={match}
            onClick={() => onSelectMatch(match)}
          />
        ))}
      </div>
    </div>
  );
}

function ArenaActivityRow({
  match,
  onClick,
}: {
  match: ArenaMatch;
  onClick: () => void;
}) {
  const challengerPlayers = match.challengerCards
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  const lineupPreview = challengerPlayers
    .map((p) => p!.name.split(" ").pop())
    .join(", ");

  return (
    <GlassPanel hover className="cursor-pointer p-3">
      <div onClick={onClick} className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
          <Swords className="h-5 w-5 text-orange-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {match.gameType} — {match.statCategories.join("/")}
            </span>
          </div>
          <div className="truncate text-xs text-white/40">
            {lineupPreview}
            {match.opponentUsername ? ` vs ${match.opponentUsername}` : " — awaiting opponent"}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs font-bold text-orange-400">
            {formatTokenAmount(match.wager)}
          </div>
          <ArenaMatchStatusBadge status={match.status} />
        </div>
      </div>
    </GlassPanel>
  );
}
