"use client";

import { useState } from "react";
import Link from "next/link";
import { Player, OwnedCard } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { PlayerCardDisplay } from "./PlayerCardDisplay";
import { PlayerDetailTabs } from "./PlayerDetailTabs";
import { CreateAuctionModal } from "@/components/auction/CreateAuctionModal";
import { CreateTradeModal } from "@/components/trade/CreateTradeModal";
import { AddWishlistModal } from "@/components/trade/AddWishlistModal";
import { useAuthStore } from "@/stores/authStore";
import { Gavel, Search, Swords, ArrowLeftRight, Heart } from "lucide-react";

interface PlayerCardModalProps {
  player: Player | null;
  ownedCard?: OwnedCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerCardModal({
  player,
  ownedCard,
  open,
  onOpenChange,
}: PlayerCardModalProps) {
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!player) return null;

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} className="max-w-5xl p-0">
        <div className="flex max-h-[80vh] flex-col md:flex-row">
          {/* Left panel: card + bio + actions */}
          <div className="shrink-0 overflow-y-auto border-b border-white/10 p-6 md:w-80 md:border-b-0 md:border-r">
            <PlayerCardDisplay player={player} />

            <div className="mt-4 space-y-2">
              {isAuthenticated && ownedCard && (
                <>
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      setShowAuctionModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-2.5 text-sm font-medium text-[#8B5CF6] transition-colors hover:bg-[#8B5CF6]/20"
                  >
                    <Gavel className="h-4 w-4" />
                    List for Auction
                  </button>

                  <button
                    onClick={() => {
                      onOpenChange(false);
                      setShowTradeModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/30 bg-[#F97316]/10 px-4 py-2.5 text-sm font-medium text-[#F97316] transition-colors hover:bg-[#F97316]/20"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Trade
                  </button>
                </>
              )}

              {isAuthenticated && !ownedCard && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    setShowWishlistModal(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#EC4899]/30 bg-[#EC4899]/10 px-4 py-2.5 text-sm font-medium text-[#EC4899] transition-colors hover:bg-[#EC4899]/20"
                >
                  <Heart className="h-4 w-4" />
                  Add to Wishlist
                </button>
              )}

              {/* Auction house search link */}
              <Link
                href={`/market?tab=auction&search=${encodeURIComponent(player.name)}`}
                onClick={() => onOpenChange(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2.5 text-sm font-medium text-[#10B981] transition-colors hover:bg-[#10B981]/20"
              >
                <Search className="h-4 w-4" />
                Find in Auction House
              </Link>

              {/* Arena link */}
              <Link
                href={`/arena?search=${encodeURIComponent(player.name)}`}
                onClick={() => onOpenChange(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F97316]/30 bg-[#F97316]/10 px-4 py-2.5 text-sm font-medium text-[#F97316] transition-colors hover:bg-[#F97316]/20"
              >
                <Swords className="h-4 w-4" />
                Find Arena Games
              </Link>
            </div>
          </div>

          {/* Right panel: tabbed data */}
          <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden p-4 pt-2 md:p-0">
            <div className="flex h-full flex-col md:px-2">
              <PlayerDetailTabs player={player} owned={!!ownedCard} />
            </div>
          </div>
        </div>
      </Modal>

      {ownedCard && (
        <>
          <CreateAuctionModal
            open={showAuctionModal}
            onOpenChange={setShowAuctionModal}
            preselectedCard={{ card: ownedCard, player }}
          />
          <CreateTradeModal
            open={showTradeModal}
            onOpenChange={setShowTradeModal}
            preselectedCard={{ card: ownedCard, player }}
          />
        </>
      )}

      <AddWishlistModal
        open={showWishlistModal}
        onOpenChange={setShowWishlistModal}
        preselectedPlayer={player}
      />
    </>
  );
}
