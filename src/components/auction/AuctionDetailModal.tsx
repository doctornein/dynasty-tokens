"use client";

import { Auction } from "@/types";
import { players } from "@/data/players";
import { Modal } from "@/components/ui/Modal";
import { PlayerCardDisplay } from "@/components/collection/PlayerCardDisplay";
import { AuctionCountdown } from "./AuctionCountdown";
import { PlaceBidForm } from "./PlaceBidForm";
import { BuyNowButton } from "./BuyNowButton";
import { BidHistory } from "./BidHistory";
import { formatTokenAmount } from "@/lib/formatters";
import { useAuthStore } from "@/stores/authStore";
import { useAuctionStore } from "@/stores/auctionStore";
import { GlowButton } from "@/components/ui/GlowButton";
import { Gavel, Clock, User, X } from "lucide-react";
import { useState } from "react";

interface AuctionDetailModalProps {
  auction: Auction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuctionDetailModal({
  auction,
  open,
  onOpenChange,
}: AuctionDetailModalProps) {
  const user = useAuthStore((s) => s.user);
  const cancelAuction = useAuctionStore((s) => s.cancelAuction);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  if (!auction) return null;

  const player = players.find((p) => p.id === auction.playerId);
  const isSeller = user?.id === auction.sellerId;
  const isHighestBidder = user?.id === auction.currentBidderId;
  const isAuthenticated = !!user;

  const handleCancel = async () => {
    setCancelError("");
    setCancelling(true);
    const result = await cancelAuction(auction.id);
    setCancelling(false);
    if (result.success) {
      onOpenChange(false);
    } else {
      setCancelError(result.error ?? "Failed to cancel");
    }
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-4xl p-0">
      <div className="flex max-h-[80vh] flex-col md:flex-row">
        {/* Left: player card */}
        <div className="shrink-0 overflow-y-auto border-b border-white/10 p-6 md:w-80 md:border-b-0 md:border-r">
          {player ? (
            <PlayerCardDisplay player={player} />
          ) : (
            <div className="flex h-56 items-center justify-center">
              <User className="h-20 w-20 text-white/10" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Right: auction details */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
          <h2 className="mb-1 text-xl font-bold text-white">
            {player?.name ?? "Unknown Player"}
          </h2>
          <p className="mb-4 text-xs text-white/40">
            Listed by {auction.sellerUsername}
          </p>

          {/* Auction info grid */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[10px] uppercase text-white/30">
                {auction.currentBid ? "Current Bid" : "Starting Bid"}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-lg font-bold text-[#8B5CF6]">
                <Gavel className="h-4 w-4" />
                {formatTokenAmount(auction.currentBid ?? auction.startingBid)}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[10px] uppercase text-white/30">Time Left</div>
              <div className="mt-1 flex items-center gap-1.5 text-lg font-bold text-white">
                <Clock className="h-4 w-4 text-white/40" />
                <AuctionCountdown endsAt={auction.endsAt} />
              </div>
            </div>

            {auction.buyNowPrice && (
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-[10px] uppercase text-white/30">Buy Now</div>
                <div className="mt-1 text-lg font-bold text-[#FFD700]">
                  {formatTokenAmount(auction.buyNowPrice)}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[10px] uppercase text-white/30">Bids</div>
              <div className="mt-1 text-lg font-bold text-white">
                {auction.bidCount}
              </div>
            </div>
          </div>

          {/* Status badges */}
          {isHighestBidder && (
            <div className="mb-4 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3 py-2 text-xs text-[#8B5CF6]">
              You are the highest bidder
            </div>
          )}

          {/* Actions */}
          {isAuthenticated && !isSeller && (
            <div className="mb-4 space-y-3">
              {auction.buyNowPrice && (
                <BuyNowButton auction={auction} onSuccess={handleClose} />
              )}
              {!isHighestBidder && (
                <PlaceBidForm auction={auction} onSuccess={handleClose} />
              )}
            </div>
          )}

          {/* Seller actions */}
          {isSeller && auction.bidCount === 0 && (
            <div className="mb-4">
              <GlowButton
                variant="purple"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full"
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  {cancelling ? "Cancelling..." : "Cancel Auction"}
                </span>
              </GlowButton>
              {cancelError && (
                <div className="mt-1 text-xs text-red-400">{cancelError}</div>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mb-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/40 text-center">
              Sign in to bid or buy
            </div>
          )}

          {/* Bid history */}
          <div className="mt-auto">
            <h3 className="mb-2 text-sm font-medium text-white/60">Bid History</h3>
            <BidHistory auctionId={auction.id} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
