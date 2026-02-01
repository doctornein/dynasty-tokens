"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { ArenaMatch } from "@/types";
import { players } from "@/data/players";
import { CardPickerGrid } from "./CardPickerGrid";
import { formatTokenAmount } from "@/lib/formatters";
import { Swords, Calendar } from "lucide-react";

interface AcceptMatchModalProps {
  match: ArenaMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcceptMatchModal({ match, open, onOpenChange }: AcceptMatchModalProps) {
  const acceptMatch = useArenaStore((s) => s.acceptMatch);
  const balance = useAuthStore((s) => s.getBalance());

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!match) return null;

  const cardCount = match.gameType === "1v1" ? 1 : match.gameType === "3v3" ? 3 : 5;
  const challengerPlayers = match.challengerCards
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  const handleAccept = async () => {
    setError("");

    if (selectedCards.length !== cardCount) {
      setError(`Select ${cardCount} player${cardCount > 1 ? "s" : ""}`);
      return;
    }

    if (balance < match.wager) {
      setError("Insufficient balance");
      return;
    }

    setSubmitting(true);
    const result = await acceptMatch(match.id, selectedCards);
    setSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      setSelectedCards([]);
    } else {
      setError(result.error ?? "Failed to accept challenge");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSelectedCards([]);
          setError("");
        }
        onOpenChange(o);
      }}
      title="Accept Challenge"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Challenge details */}
        <div className="rounded-xl bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
              {match.gameType}
            </span>
            {match.statCategories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="mb-2 text-sm text-white">
            <span className="text-white/40">Challenger:</span>{" "}
            {match.challengerUsername}
          </div>

          <div className="mb-2 flex flex-wrap gap-1">
            {challengerPlayers.map((p) => (
              <span
                key={p!.id}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60"
              >
                {p!.name}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Swords className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">
                {formatTokenAmount(match.wager)} wager
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <Calendar className="h-3 w-3" />
              {match.startDate} — {match.endDate}
            </div>
          </div>
        </div>

        {/* Card picker */}
        <p className="text-sm text-white/40">
          Select {cardCount} player{cardCount > 1 ? "s" : ""} for your lineup
        </p>
        <CardPickerGrid
          maxSelection={cardCount}
          selected={selectedCards}
          onSelectionChange={setSelectedCards}
        />

        <div className="text-xs text-white/30">
          Your wager of {formatTokenAmount(match.wager)} will be escrowed.
          Balance: {formatTokenAmount(balance)}
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}

        <GlowButton
          variant="orange"
          onClick={handleAccept}
          disabled={submitting || selectedCards.length !== cardCount}
          className="w-full"
        >
          {submitting ? "Accepting..." : `Accept Challenge (${formatTokenAmount(match.wager)})`}
        </GlowButton>
      </div>
    </Modal>
  );
}
