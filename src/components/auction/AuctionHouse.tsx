"use client";

import { useEffect, useState } from "react";
import { useAuctionStore } from "@/stores/auctionStore";
import { useAuthStore } from "@/stores/authStore";
import { AuctionGrid } from "./AuctionGrid";
import { MyAuctionActivity } from "./MyAuctionActivity";
import { CreateAuctionModal } from "./CreateAuctionModal";
import { AuctionDetailModal } from "./AuctionDetailModal";
import { GlowButton } from "@/components/ui/GlowButton";
import { Gavel, LayoutList } from "lucide-react";
import { Auction } from "@/types";

export function AuctionHouse() {
  const { auctions, loading, fetchAuctions, fetchMyListings } = useAuctionStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const [showCreate, setShowCreate] = useState(false);
  const [showMyActivity, setShowMyActivity] = useState(false);
  const [activityAuction, setActivityAuction] = useState<Auction | null>(null);

  useEffect(() => {
    fetchAuctions();
    if (isAuthenticated) {
      fetchMyListings();
    }
  }, [fetchAuctions, fetchMyListings, isAuthenticated]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Gavel className="h-8 w-8 text-[#8B5CF6]" />
          <div>
            <h2 className="text-3xl font-bold text-white">Auction House</h2>
            <p className="text-sm text-white/40">
              List your cards for auction or bid on listings from other players
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <button
                onClick={() => setShowMyActivity(!showMyActivity)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showMyActivity
                    ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                    : "text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                My Activity
              </button>
              <GlowButton
                variant="purple"
                size="sm"
                onClick={() => setShowCreate(true)}
              >
                <span className="flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  Create Auction
                </span>
              </GlowButton>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {showMyActivity ? (
        <MyAuctionActivity onSelectAuction={setActivityAuction} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <AuctionGrid auctions={auctions} />
      )}

      {/* Create modal */}
      <CreateAuctionModal
        open={showCreate}
        onOpenChange={setShowCreate}
      />

      {/* Activity detail modal */}
      <AuctionDetailModal
        auction={activityAuction}
        open={!!activityAuction}
        onOpenChange={(open) => !open && setActivityAuction(null)}
      />
    </div>
  );
}
