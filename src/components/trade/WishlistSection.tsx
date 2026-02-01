"use client";

import { useState } from "react";
import { useTradeStore } from "@/stores/tradeStore";
import { players } from "@/data/players";
import { resolveLegacyId } from "@/data/legacy-id-map";
import { TradeWishlistEntry } from "@/types";
import { AddWishlistModal } from "./AddWishlistModal";
import { Heart, Trash2, Loader2, Plus } from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";
import { GlowButton } from "@/components/ui/GlowButton";

function resolvePlayerName(playerId: string): string {
  const resolvedId = resolveLegacyId(playerId);
  const player = players.find(
    (p) => p.id === resolvedId || p.id === playerId
  );
  return player?.name ?? playerId;
}

function resolvePlayerImage(playerId: string): string | null {
  const resolvedId = resolveLegacyId(playerId);
  const player = players.find(
    (p) => p.id === resolvedId || p.id === playerId
  );
  return player?.image ?? null;
}

function WishlistCard({
  entry,
  onRemove,
  removing,
}: {
  entry: TradeWishlistEntry;
  onRemove: () => void;
  removing: boolean;
}) {
  const image = resolvePlayerImage(entry.playerId);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-10 w-10 rounded-full bg-white/5 object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xs text-white/30">
          ?
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white truncate">
          {resolvePlayerName(entry.playerId)}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
          <span>
            Cards:{" "}
            {entry.maxCardsGive === null ? "Unlimited" : entry.maxCardsGive}
          </span>
          <span>Give: {formatTokenAmount(entry.maxDtGive)}</span>
          <span>Receive: {formatTokenAmount(entry.minDtReceive)}</span>
        </div>
      </div>

      <button
        onClick={onRemove}
        disabled={removing}
        className="shrink-0 rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      >
        {removing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function WishlistSection() {
  const { wishlists, removeWishlist } = useTradeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (playerId: string) => {
    setRemovingId(playerId);
    await removeWishlist(playerId);
    setRemovingId(null);
  };

  if (wishlists.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Heart className="h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">
          No wishlist entries yet
        </p>
        <p className="max-w-xs text-xs text-white/30">
          Add players to your wishlist to auto-accept matching trade offers
        </p>
        <GlowButton variant="orange" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add to Wishlist
        </GlowButton>
        <AddWishlistModal open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          Trades matching these rules will be auto-accepted
        </p>
        <GlowButton
          variant="orange"
          size="sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </GlowButton>
      </div>

      {wishlists.map((entry) => (
        <WishlistCard
          key={entry.id}
          entry={entry}
          onRemove={() => handleRemove(entry.playerId)}
          removing={removingId === entry.playerId}
        />
      ))}

      <AddWishlistModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
