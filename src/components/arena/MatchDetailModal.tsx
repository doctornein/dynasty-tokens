"use client";

import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { ArenaMatch } from "@/types";
import { players } from "@/data/players";
import { ArenaMatchStatusBadge } from "./ArenaMatchStatusBadge";
import { formatTokenAmount } from "@/lib/formatters";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { Swords, Calendar, Trophy } from "lucide-react";
import { useState } from "react";

interface MatchDetailModalProps {
  match: ArenaMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlayerLineup({ label, cardIds, score }: { label: string; cardIds: string[]; score: number | null }) {
  const lineupPlayers = cardIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="flex-1">
      <div className="mb-2 text-xs text-white/40">{label}</div>
      <div className="space-y-1">
        {lineupPlayers.map((p) => (
          <div
            key={p!.id}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white"
          >
            {p!.name}
            <span className="ml-1 text-[10px] text-white/30">
              {p!.teamAbbr}
            </span>
          </div>
        ))}
      </div>
      {score !== null && (
        <div className="mt-2 text-center text-lg font-bold text-white">
          {score}
        </div>
      )}
    </div>
  );
}

export function MatchDetailModal({ match, open, onOpenChange }: MatchDetailModalProps) {
  const cancelMatch = useArenaStore((s) => s.cancelMatch);
  const userId = useAuthStore((s) => s.user?.id);
  const [cancelling, setCancelling] = useState(false);

  if (!match) return null;

  const isChallenger = match.challengerId === userId;
  const canCancel = isChallenger && match.status === "open";
  const isWinner = match.winnerId === userId;
  const isSettled = match.status === "settled";

  const handleCancel = async () => {
    setCancelling(true);
    await cancelMatch(match.id);
    setCancelling(false);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Match Details"
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
            {match.gameType}
          </span>
          <ArenaMatchStatusBadge status={match.status} />
          {match.statCategories.map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Wager & dates */}
        <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5">
            <Swords className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">
              {formatTokenAmount(match.wager)} wager
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Calendar className="h-3 w-3" />
            {match.startDate} — {match.endDate}
          </div>
        </div>

        {/* Winner banner */}
        {isSettled && match.winnerId && (
          <div className={`flex items-center gap-2 rounded-xl p-3 ${
            isWinner ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}>
            <Trophy className={`h-5 w-5 ${isWinner ? "text-emerald-400" : "text-red-400"}`} />
            <span className={`text-sm font-bold ${isWinner ? "text-emerald-400" : "text-red-400"}`}>
              {isWinner ? "You won!" : "You lost"}
            </span>
            <span className="ml-auto text-sm font-bold text-white/60">
              Pot: {formatTokenAmount(match.wager * 2)}
            </span>
          </div>
        )}

        {isSettled && !match.winnerId && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
            <span className="text-sm font-medium text-white/60">Tie — wagers refunded</span>
          </div>
        )}

        {match.status === "voided" && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3">
            <span className="text-sm font-medium text-red-400">
              Match voided (DNP) — wagers refunded
            </span>
          </div>
        )}

        {/* Lineups side by side */}
        <div className="flex gap-4">
          <PlayerLineup
            label={`Challenger — ${match.challengerUsername}`}
            cardIds={match.challengerCards}
            score={match.challengerScore}
          />
          {match.opponentCards ? (
            <PlayerLineup
              label={`Opponent — ${match.opponentUsername ?? "?"}`}
              cardIds={match.opponentCards}
              score={match.opponentScore}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-white/20">
              Awaiting opponent
            </div>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <GlowButton
            variant="orange"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full"
          >
            {cancelling ? "Cancelling..." : "Cancel Challenge"}
          </GlowButton>
        )}
      </div>
    </Modal>
  );
}
