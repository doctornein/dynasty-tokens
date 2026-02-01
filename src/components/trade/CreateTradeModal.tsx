"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useTradeStore } from "@/stores/tradeStore";
import { useAuthStore } from "@/stores/authStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { players } from "@/data/players";
import { resolveLegacyId } from "@/data/legacy-id-map";
import { Player, OwnedCard } from "@/types";
import { PlayerCard } from "@/components/collection/PlayerCard";
import { Search, Check, Loader2, Globe, Users } from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";

interface CreateTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCard?: { card: OwnedCard; player: Player };
}

type TradeMode = "direct" | "open";
type Step = "mode" | "recipient" | "your-cards" | "their-cards" | "desired-cards" | "details";

function CardGrid({
  ownedCards,
  selected,
  onToggle,
  maxSelection,
}: {
  ownedCards: OwnedCard[];
  selected: string[];
  onToggle: (playerId: string) => void;
  maxSelection?: number;
}) {
  const [search, setSearch] = useState("");

  const ownedPlayers = useMemo(() => {
    const seen = new Set<string>();
    const result: Player[] = [];
    for (const card of ownedCards) {
      const resolvedId = resolveLegacyId(card.playerId);
      if (seen.has(resolvedId)) continue;
      seen.add(resolvedId);
      const player = players.find(
        (p) => p.id === resolvedId || p.id === card.playerId
      );
      if (player) result.push(player);
    }
    return result;
  }, [ownedCards]);

  const filtered = useMemo(() => {
    if (!search) return ownedPlayers;
    const q = search.toLowerCase();
    return ownedPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamAbbr.toLowerCase().includes(q)
    );
  }, [ownedPlayers, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {selected.length} selected
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
        />
      </div>

      {ownedPlayers.length === 0 && (
        <div className="py-8 text-center text-sm text-white/40">
          No cards available
        </div>
      )}

      <div className="grid max-h-[35vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
        {filtered.map((player) => {
          const isSelected = selected.includes(player.id);
          const atMax =
            maxSelection !== undefined && selected.length >= maxSelection;
          return (
            <div
              key={player.id}
              className="relative"
              onClick={() => onToggle(player.id)}
            >
              <div
                className={`rounded-2xl transition-all ${
                  isSelected
                    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#12121a]"
                    : atMax && !isSelected
                      ? "opacity-40"
                      : ""
                }`}
              >
                <PlayerCard player={player} compact />
              </div>
              {isSelected && (
                <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GlobalPlayerGrid({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (playerId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return players.slice(0, 30);
    const q = search.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamAbbr.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {selected.length} selected
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all players..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
        />
      </div>

      {!search && (
        <div className="text-[10px] text-white/30">
          Type to search from all players
        </div>
      )}

      <div className="grid max-h-[35vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
        {filtered.map((player) => {
          const isSelected = selected.includes(player.id);
          return (
            <div
              key={player.id}
              className="relative"
              onClick={() => onToggle(player.id)}
            >
              <div
                className={`rounded-2xl transition-all ${
                  isSelected
                    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#12121a]"
                    : ""
                }`}
              >
                <PlayerCard player={player} compact />
              </div>
              {isSelected && (
                <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreateTradeModal({ open, onOpenChange, preselectedCard }: CreateTradeModalProps) {
  const createTrade = useTradeStore((s) => s.createTrade);
  const balance = useAuthStore((s) => s.getBalance());
  const myCards = useCollectionStore((s) => s.ownedCards);

  const [tradeMode, setTradeMode] = useState<TradeMode>("direct");
  const [step, setStep] = useState<Step>("mode");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [recipientCards, setRecipientCards] = useState<OwnedCard[]>([]);
  const [loadingRecipient, setLoadingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState("");

  const [senderSelectedCards, setSenderSelectedCards] = useState<string[]>([]);
  const [receiverSelectedCards, setReceiverSelectedCards] = useState<string[]>(
    []
  );
  const [desiredCards, setDesiredCards] = useState<string[]>([]);
  const [senderDt, setSenderDt] = useState("0");
  const [receiverDt, setReceiverDt] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Handle preselectedCard
  useEffect(() => {
    if (open && preselectedCard) {
      setSenderSelectedCards([preselectedCard.player.id]);
      setTradeMode("direct");
      setStep("mode");
    }
  }, [open, preselectedCard]);

  const reset = () => {
    setTradeMode("direct");
    setStep("mode");
    setRecipientUsername("");
    setRecipientCards([]);
    setRecipientError("");
    setSenderSelectedCards([]);
    setReceiverSelectedCards([]);
    setDesiredCards([]);
    setSenderDt("0");
    setReceiverDt("0");
    setMessage("");
    setError("");
  };

  const lookupRecipient = async () => {
    if (!recipientUsername.trim()) return;
    setRecipientError("");
    setLoadingRecipient(true);

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", recipientUsername.trim())
        .single();

      if (!profile) {
        setRecipientError("User not found");
        setLoadingRecipient(false);
        return;
      }

      const userId = useAuthStore.getState().user?.id;
      if (profile.id === userId) {
        setRecipientError("Cannot trade with yourself");
        setLoadingRecipient(false);
        return;
      }

      const { data } = await supabase
        .from("owned_cards")
        .select("*")
        .eq("user_id", profile.id)
        .order("acquired_at", { ascending: false });

      setRecipientCards(
        (data ?? []).map((c) => ({
          instanceId: c.instance_id,
          playerId: c.player_id,
          acquiredAt: c.acquired_at,
          packId: c.pack_id,
        }))
      );

      setStep("your-cards");
    } catch {
      setRecipientError("Failed to look up user");
    } finally {
      setLoadingRecipient(false);
    }
  };

  const toggleSenderCard = (playerId: string) => {
    setSenderSelectedCards((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleReceiverCard = (playerId: string) => {
    setReceiverSelectedCards((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleDesiredCard = (playerId: string) => {
    setDesiredCards((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSubmit = async () => {
    setError("");

    const sDt = Number(senderDt) || 0;
    const rDt = Number(receiverDt) || 0;
    const cardsToRequest = isOpen ? desiredCards : receiverSelectedCards;

    if (
      senderSelectedCards.length === 0 &&
      cardsToRequest.length === 0 &&
      sDt === 0 &&
      rDt === 0
    ) {
      setError("Trade must include cards or DT");
      return;
    }

    if (isOpen && senderSelectedCards.length === 0) {
      setError("Open offers must include at least one card");
      return;
    }

    if (sDt > balance) {
      setError("Insufficient DT balance");
      return;
    }

    setSubmitting(true);
    const result = await createTrade(
      isOpen ? null : recipientUsername.trim(),
      senderSelectedCards,
      cardsToRequest,
      sDt,
      rDt,
      message || undefined
    );
    setSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      reset();
    } else {
      setError(result.error ?? "Failed to create trade");
    }
  };

  const isOpen = tradeMode === "open";

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Create Trade"
      className="max-w-2xl"
    >
      {/* Step 1: Choose trade mode */}
      {step === "mode" && (
        <div className="space-y-4">
          <p className="text-sm text-white/40">
            Choose how you want to trade
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTradeMode("direct");
                setStep("recipient");
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                tradeMode === "direct"
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <Users className="h-6 w-6 text-orange-400" />
              <span className="text-sm font-medium text-white">Direct Trade</span>
              <span className="text-[10px] text-white/40">
                Trade with a specific user
              </span>
            </button>
            <button
              onClick={() => {
                setTradeMode("open");
                setStep("your-cards");
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                tradeMode === "open"
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <Globe className="h-6 w-6 text-orange-400" />
              <span className="text-sm font-medium text-white">Open Offer</span>
              <span className="text-[10px] text-white/40">
                Anyone can fulfill your offer
              </span>
            </button>
          </div>

          {preselectedCard && (
            <div className="rounded-lg bg-white/5 p-2 text-xs text-white/50">
              Pre-selected: <span className="text-white">{preselectedCard.player.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Step: Recipient (Direct only) */}
      {step === "recipient" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("mode")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back
          </button>
          <p className="text-sm text-white/40">
            Enter the username of the player you want to trade with
          </p>
          <div>
            <input
              type="text"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupRecipient()}
              placeholder="Username"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
            />
            {recipientError && (
              <div className="mt-1 text-xs text-red-400">{recipientError}</div>
            )}
          </div>
          <GlowButton
            variant="orange"
            onClick={lookupRecipient}
            disabled={!recipientUsername.trim() || loadingRecipient}
            className="w-full"
          >
            {loadingRecipient ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up...
              </span>
            ) : (
              "Next: Select Your Cards"
            )}
          </GlowButton>
        </div>
      )}

      {/* Step: Select your cards */}
      {step === "your-cards" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(isOpen ? "mode" : "recipient")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back
          </button>
          <p className="text-sm text-white/40">
            Select cards to {isOpen ? "offer" : `send to ${recipientUsername}`}
          </p>
          <CardGrid
            ownedCards={myCards}
            selected={senderSelectedCards}
            onToggle={toggleSenderCard}
          />
          <GlowButton
            variant="orange"
            onClick={() => setStep(isOpen ? "desired-cards" : "their-cards")}
            className="w-full"
          >
            Next: {isOpen ? "Desired Cards" : "Select Cards You Want"}
          </GlowButton>
        </div>
      )}

      {/* Step: Select their cards (Direct only) */}
      {step === "their-cards" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("your-cards")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to your cards
          </button>
          <p className="text-sm text-white/40">
            Select cards you want from{" "}
            <span className="text-white">{recipientUsername}</span>
          </p>
          <CardGrid
            ownedCards={recipientCards}
            selected={receiverSelectedCards}
            onToggle={toggleReceiverCard}
          />
          <GlowButton
            variant="orange"
            onClick={() => setStep("details")}
            className="w-full"
          >
            Next: Details
          </GlowButton>
        </div>
      )}

      {/* Step: Desired cards (Open offer only) — search all players */}
      {step === "desired-cards" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("your-cards")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to your cards
          </button>
          <p className="text-sm text-white/40">
            Select cards you want in return (from any player)
          </p>
          <GlobalPlayerGrid
            selected={desiredCards}
            onToggle={toggleDesiredCard}
          />
          <GlowButton
            variant="orange"
            onClick={() => setStep("details")}
            className="w-full"
          >
            Next: Details
          </GlowButton>
        </div>
      )}

      {/* Step: DT amounts, message, submit */}
      {step === "details" && (
        <div className="space-y-4">
          <button
            onClick={() =>
              setStep(isOpen ? "desired-cards" : "their-cards")
            }
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to card selection
          </button>

          {/* Trade summary */}
          <div className="rounded-xl bg-white/5 p-3 space-y-2">
            <div className="text-xs text-white/40">
              You {isOpen ? "offer" : "send"}: {senderSelectedCards.length} card
              {senderSelectedCards.length !== 1 ? "s" : ""}
            </div>
            <div className="text-xs text-white/40">
              You {isOpen ? "want" : "receive"}:{" "}
              {(isOpen ? desiredCards : receiverSelectedCards).length} card
              {(isOpen ? desiredCards : receiverSelectedCards).length !== 1
                ? "s"
                : ""}
            </div>
            {isOpen && (
              <div className="mt-1 rounded bg-orange-500/10 px-2 py-1 text-[10px] text-orange-400">
                Open offer — anyone can fulfill this trade
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-white/40">
                You Send (DT)
              </label>
              <input
                type="number"
                value={senderDt}
                onChange={(e) => setSenderDt(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50"
              />
              <div className="mt-1 text-[10px] text-white/30">
                Balance: {formatTokenAmount(balance)}
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-white/40">
                You Request (DT)
              </label>
              <input
                type="number"
                value={receiverDt}
                onChange={(e) => setReceiverDt(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">
              Message (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <GlowButton
            variant="orange"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting
              ? "Sending..."
              : isOpen
                ? "Create Open Offer"
                : "Send Trade Offer"}
          </GlowButton>
        </div>
      )}
    </Modal>
  );
}
