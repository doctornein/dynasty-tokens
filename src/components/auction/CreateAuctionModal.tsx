"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useCollectionStore } from "@/stores/collectionStore";
import { useAuctionStore } from "@/stores/auctionStore";
import { players } from "@/data/players";
import { OwnedCard, Player } from "@/types";
import { PlayerCard } from "@/components/collection/PlayerCard";
import { Search } from "lucide-react";

const DURATIONS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "12h", hours: 12 },
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "72h", hours: 72 },
];

interface CreateAuctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCard?: { card: OwnedCard; player: Player } | null;
}

export function CreateAuctionModal({
  open,
  onOpenChange,
  preselectedCard,
}: CreateAuctionModalProps) {
  const ownedCards = useCollectionStore((s) => s.ownedCards);
  const myListings = useAuctionStore((s) => s.myListings);
  const createAuction = useAuctionStore((s) => s.createAuction);

  const [selectedCard, setSelectedCard] = useState<{
    card: OwnedCard;
    player: Player;
  } | null>(preselectedCard ?? null);
  const [startingBid, setStartingBid] = useState("10");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [duration, setDuration] = useState(24);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"pick" | "details">(
    preselectedCard ? "details" : "pick"
  );

  // Cards available to list (not in active auctions)
  const activeCardIds = useMemo(() => {
    return new Set(
      myListings
        .filter((a) => a.status === "active")
        .map((a) => a.cardInstanceId)
    );
  }, [myListings]);

  const availableCards = useMemo(() => {
    return ownedCards
      .filter((c) => !activeCardIds.has(c.instanceId))
      .map((card) => {
        const player = players.find((p) => p.id === card.playerId);
        return player ? { card, player } : null;
      })
      .filter(Boolean) as { card: OwnedCard; player: Player }[];
  }, [ownedCards, activeCardIds]);

  const filteredCards = useMemo(() => {
    if (!search) return availableCards;
    const q = search.toLowerCase();
    return availableCards.filter((c) =>
      c.player.name.toLowerCase().includes(q)
    );
  }, [availableCards, search]);

  const handleSubmit = async () => {
    if (!selectedCard) return;
    setError("");

    const bid = Number(startingBid);
    if (isNaN(bid) || bid <= 0) {
      setError("Starting bid must be greater than 0");
      return;
    }

    let buyNow: number | null = null;
    if (buyNowPrice.trim()) {
      buyNow = Number(buyNowPrice);
      if (isNaN(buyNow) || buyNow <= bid) {
        setError("Buy-now price must exceed starting bid");
        return;
      }
    }

    setSubmitting(true);
    const result = await createAuction(
      selectedCard.card.instanceId,
      selectedCard.player.id,
      bid,
      buyNow,
      duration
    );
    setSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      // Reset
      setSelectedCard(null);
      setStartingBid("10");
      setBuyNowPrice("");
      setDuration(24);
      setStep("pick");
    } else {
      setError(result.error ?? "Failed to create auction");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Auction"
      className="max-w-2xl"
    >
      {step === "pick" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your cards..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#8B5CF6]/50"
            />
          </div>

          {availableCards.length === 0 && (
            <div className="py-8 text-center text-sm text-white/40">
              No cards available to list
            </div>
          )}

          <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {filteredCards.map(({ card, player }) => (
              <div
                key={card.instanceId}
                onClick={() => {
                  setSelectedCard({ card, player });
                  setStep("details");
                }}
              >
                <PlayerCard player={player} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "details" && selectedCard && (
        <div className="space-y-4">
          <button
            onClick={() => {
              if (!preselectedCard) {
                setSelectedCard(null);
                setStep("pick");
              }
            }}
            className="text-xs text-[#8B5CF6] hover:underline"
          >
            {preselectedCard ? "" : "← Pick a different card"}
          </button>

          <div className="flex items-center gap-4 rounded-xl bg-white/5 p-3">
            <div className="text-sm font-bold text-white">
              {selectedCard.player.name}
            </div>
            <div className="text-xs text-white/40">
              {selectedCard.player.teamAbbr} · {selectedCard.player.position}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">
              Starting Bid (DT)
            </label>
            <input
              type="number"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              min="1"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#8B5CF6]/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">
              Buy Now Price (optional, DT)
            </label>
            <input
              type="number"
              value={buyNowPrice}
              onChange={(e) => setBuyNowPrice(e.target.value)}
              placeholder="Leave empty for no buy-now"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#8B5CF6]/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.hours}
                  onClick={() => setDuration(d.hours)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    duration === d.hours
                      ? "bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30"
                      : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <GlowButton
            variant="purple"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating Auction..." : "Create Auction"}
          </GlowButton>
        </div>
      )}
    </Modal>
  );
}
