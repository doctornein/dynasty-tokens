"use client";

import { useEffect, useState } from "react";
import { useAuctionStore } from "@/stores/auctionStore";
import { useAuthStore } from "@/stores/authStore";
import { Auction } from "@/types";
import { players } from "@/data/players";
import { formatTokenAmount } from "@/lib/formatters";
import { AuctionCountdown } from "./AuctionCountdown";
import { GlassPanel } from "@/components/ui/GlassPanel";

type Tab = "listings" | "bids";

interface MyAuctionActivityProps {
  onSelectAuction: (auction: Auction) => void;
}

export function MyAuctionActivity({ onSelectAuction }: MyAuctionActivityProps) {
  const [tab, setTab] = useState<Tab>("listings");
  const { myListings, myBids, fetchMyListings, fetchMyBids } = useAuctionStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyListings();
      fetchMyBids();
    }
  }, [isAuthenticated, fetchMyListings, fetchMyBids]);

  if (!isAuthenticated) {
    return (
      <div className="py-12 text-center text-sm text-white/40">
        Sign in to view your auction activity
      </div>
    );
  }

  const items = tab === "listings" ? myListings : myBids;

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("listings")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "listings"
              ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          My Listings ({myListings.length})
        </button>
        <button
          onClick={() => setTab("bids")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "bids"
              ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
              : "text-white/40 hover:bg-white/5"
          }`}
        >
          My Bids ({myBids.length})
        </button>
      </div>

      {items.length === 0 && (
        <div className="py-12 text-center text-sm text-white/40">
          {tab === "listings"
            ? "You haven't listed any auctions yet"
            : "You haven't bid on any auctions yet"}
        </div>
      )}

      <div className="space-y-2">
        {items.map((auction) => (
          <AuctionActivityRow
            key={auction.id}
            auction={auction}
            onClick={() => onSelectAuction(auction)}
          />
        ))}
      </div>
    </div>
  );
}

function AuctionActivityRow({
  auction,
  onClick,
}: {
  auction: Auction;
  onClick: () => void;
}) {
  const player = players.find((p) => p.id === auction.playerId);

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400/10",
    settled: "text-white/40 bg-white/5",
    cancelled: "text-red-400 bg-red-400/10",
  };

  return (
    <GlassPanel
      hover
      className="cursor-pointer p-3"
    >
      <div onClick={onClick} className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">
            {player?.name ?? "Unknown Player"}
          </div>
          <div className="text-xs text-white/40">
            {auction.currentBid
              ? `Current bid: ${formatTokenAmount(auction.currentBid)}`
              : `Starting: ${formatTokenAmount(auction.startingBid)}`}
            {" · "}
            {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {auction.status === "active" && (
            <AuctionCountdown endsAt={auction.endsAt} className="text-xs text-white/60" />
          )}
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[auction.status]}`}
          >
            {auction.status}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
