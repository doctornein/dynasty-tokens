"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useTradeStore } from "@/stores/tradeStore";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCard } from "@/components/collection/PlayerCard";
import { Search, Check } from "lucide-react";

interface AddWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPlayer?: Player | null;
}

export function AddWishlistModal({
  open,
  onOpenChange,
  preselectedPlayer,
}: AddWishlistModalProps) {
  const upsertWishlist = useTradeStore((s) => s.upsertWishlist);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [search, setSearch] = useState("");
  const [maxCardsGive, setMaxCardsGive] = useState("");
  const [unlimited, setUnlimited] = useState(true);
  const [maxDtGive, setMaxDtGive] = useState("0");
  const [minDtReceive, setMinDtReceive] = useState("0");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && preselectedPlayer) {
      setSelectedPlayer(preselectedPlayer);
    }
  }, [open, preselectedPlayer]);

  const reset = () => {
    setSelectedPlayer(null);
    setSearch("");
    setMaxCardsGive("");
    setUnlimited(true);
    setMaxDtGive("0");
    setMinDtReceive("0");
    setError("");
  };

  const filtered = useMemo(() => {
    if (!search) return players.slice(0, 30);
    const q = search.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamAbbr.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSubmit = async () => {
    if (!selectedPlayer) return;
    setError("");
    setSubmitting(true);

    const result = await upsertWishlist(
      selectedPlayer.id,
      unlimited ? null : Number(maxCardsGive) || 0,
      Number(maxDtGive) || 0,
      Number(minDtReceive) || 0
    );

    setSubmitting(false);
    if (result.success) {
      onOpenChange(false);
      reset();
    } else {
      setError(result.error ?? "Failed to save wishlist entry");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Add to Wishlist"
      className="max-w-lg"
    >
      {!selectedPlayer ? (
        <div className="space-y-3">
          <p className="text-sm text-white/40">
            Search for a player to add to your trade wishlist
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all players..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-pink-500/50"
            />
          </div>

          {!search && (
            <div className="text-[10px] text-white/30">
              Type to search from all players
            </div>
          )}

          <div className="grid max-h-[40vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {filtered.map((player) => (
              <div
                key={player.id}
                className="relative cursor-pointer"
                onClick={() => setSelectedPlayer(player)}
              >
                <PlayerCard player={player} compact />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => {
              if (!preselectedPlayer) setSelectedPlayer(null);
            }}
            className={`text-xs ${preselectedPlayer ? "text-white/30" : "text-pink-400 hover:underline"}`}
            disabled={!!preselectedPlayer}
          >
            {preselectedPlayer
              ? `Player: ${selectedPlayer.name}`
              : `\u2190 Change player (${selectedPlayer.name})`}
          </button>

          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-sm font-medium text-white">
              {selectedPlayer.name}
            </div>
            <div className="text-xs text-white/40">
              {selectedPlayer.teamAbbr} &middot; {selectedPlayer.position} &middot;{" "}
              {selectedPlayer.overallRating} OVR
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">
              Max cards to give
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => setUnlimited(e.target.checked)}
                  className="rounded"
                />
                Unlimited
              </label>
              {!unlimited && (
                <input
                  type="number"
                  value={maxCardsGive}
                  onChange={(e) => setMaxCardsGive(e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-pink-500/50"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-white/40">
                Max DT to give
              </label>
              <input
                type="number"
                value={maxDtGive}
                onChange={(e) => setMaxDtGive(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-pink-500/50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-white/40">
                Min DT to receive
              </label>
              <input
                type="number"
                value={minDtReceive}
                onChange={(e) => setMinDtReceive(e.target.value)}
                min="0"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-pink-500/50"
              />
            </div>
          </div>

          <p className="text-[10px] text-white/30">
            Incoming trades matching these conditions will be auto-accepted if
            you own the requested cards and have sufficient DT.
          </p>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <GlowButton
            variant="orange"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Saving..." : "Save Wishlist Entry"}
          </GlowButton>
        </div>
      )}
    </Modal>
  );
}
