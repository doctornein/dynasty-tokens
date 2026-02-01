"use client";

import { useEffect, useState } from "react";
import { useAuctionStore } from "@/stores/auctionStore";
import { Bid } from "@/types";
import { formatTokenAmount, formatRelativeTime } from "@/lib/formatters";

interface BidHistoryProps {
  auctionId: string;
}

export function BidHistory({ auctionId }: BidHistoryProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchBids = useAuctionStore((s) => s.fetchBidsForAuction);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBids(auctionId).then((result) => {
      if (!cancelled) {
        setBids(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [auctionId, fetchBids]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return <div className="py-4 text-center text-xs text-white/30">No bids yet</div>;
  }

  return (
    <div className="max-h-48 space-y-1.5 overflow-y-auto">
      {bids.map((bid, i) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
            i === 0 ? "bg-[#8B5CF6]/10 border border-[#8B5CF6]/20" : "bg-white/5"
          }`}
        >
          <div>
            <span className={`font-medium ${i === 0 ? "text-[#8B5CF6]" : "text-white/70"}`}>
              {bid.bidderUsername}
            </span>
            <span className="ml-2 text-white/30">
              {formatRelativeTime(new Date(bid.createdAt))}
            </span>
          </div>
          <span className={`font-bold ${i === 0 ? "text-[#8B5CF6]" : "text-white/60"}`}>
            {formatTokenAmount(bid.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
