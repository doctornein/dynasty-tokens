"use client";

import { useState } from "react";
import { Player, OwnedCard } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { PlayerCardDisplay } from "./PlayerCardDisplay";
import { PlayerDetailTabs } from "./PlayerDetailTabs";
import { CreateAuctionModal } from "@/components/auction/CreateAuctionModal";
import { useAuthStore } from "@/stores/authStore";
import { Gavel } from "lucide-react";

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!player) return null;

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} className="max-w-5xl p-0">
        <div className="flex max-h-[80vh] flex-col md:flex-row">
          {/* Left panel: card + bio */}
          <div className="shrink-0 overflow-y-auto border-b border-white/10 p-6 md:w-80 md:border-b-0 md:border-r">
            <PlayerCardDisplay player={player} />
            {isAuthenticated && ownedCard && (
              <button
                onClick={() => {
                  onOpenChange(false);
                  setShowAuctionModal(true);
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-2.5 text-sm font-medium text-[#8B5CF6] transition-colors hover:bg-[#8B5CF6]/20"
              >
                <Gavel className="h-4 w-4" />
                List for Auction
              </button>
            )}
          </div>

          {/* Right panel: tabbed data */}
          <div className="flex min-h-[300px] min-w-0 flex-1 flex-col overflow-hidden p-4 pt-2 md:p-0">
            <div className="flex h-full flex-col md:px-2">
              <PlayerDetailTabs player={player} />
            </div>
          </div>
        </div>
      </Modal>

      {ownedCard && (
        <CreateAuctionModal
          open={showAuctionModal}
          onOpenChange={setShowAuctionModal}
          preselectedCard={{ card: ownedCard, player }}
        />
      )}
    </>
  );
}
