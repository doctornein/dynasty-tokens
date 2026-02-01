"use client";

import { useEffect, useState } from "react";
import { Player } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Package, Gavel, ArrowLeftRight, Loader2 } from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";

interface TimelineEvent {
  id: string;
  type: "pack" | "auction" | "trade";
  description: string;
  date: string;
  amount?: number;
}

interface CardHistoryTabProps {
  player: Player;
}

export function CardHistoryTab({ player }: CardHistoryTabProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [totalCopies, setTotalCopies] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const supabase = createClient();

      // Get all owned instances of this card
      const { data: ownedData } = await supabase
        .from("owned_cards")
        .select("instance_id, user_id, acquired_at, pack_id, owner:profiles!user_id(username)")
        .eq("player_id", player.id);

      // Get settled auctions for this player
      const { data: auctionData } = await supabase
        .from("auctions")
        .select(
          "id, current_bid, settled_at, seller:profiles!seller_id(username), buyer:profiles!current_bidder_id(username)"
        )
        .eq("player_id", player.id)
        .eq("status", "settled")
        .order("settled_at", { ascending: false });

      const timeline: TimelineEvent[] = [];

      // Pack pulls
      if (ownedData) {
        setTotalCopies(ownedData.length);
        for (const card of ownedData) {
          const owner = card.owner as unknown as { username: string } | null;
          const username = owner?.username ?? "Unknown";
          timeline.push({
            id: `pack-${card.instance_id}`,
            type: "pack",
            description: `Packed by ${username}`,
            date: card.acquired_at,
          });
        }
      }

      // Auction sales
      if (auctionData) {
        for (const auction of auctionData) {
          const seller = auction.seller as unknown as { username: string } | null;
          const buyer = auction.buyer as unknown as { username: string } | null;
          const sellerName = seller?.username ?? "Unknown";
          const buyerName = buyer?.username ?? "Unknown";
          const amount = Number(auction.current_bid) || 0;
          timeline.push({
            id: `auction-${auction.id}`,
            type: "auction",
            description: `Sold via auction by ${sellerName} to ${buyerName} for ${formatTokenAmount(amount)}`,
            date: auction.settled_at,
            amount,
          });
        }
      }

      // Sort newest first
      timeline.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(timeline);
      setLoading(false);
    }

    fetchHistory();
  }, [player.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Package className="h-8 w-8 text-white/20" />
        <p className="text-sm text-white/40">No history for this card</p>
      </div>
    );
  }

  const iconMap = {
    pack: <Package className="h-4 w-4 text-blue-400" />,
    auction: <Gavel className="h-4 w-4 text-orange-400" />,
    trade: <ArrowLeftRight className="h-4 w-4 text-green-400" />,
  };

  return (
    <div className="space-y-3 p-4">
      {/* Copies in circulation */}
      <div className="rounded-xl bg-white/5 p-3 text-center">
        <div className="text-lg font-bold text-white">{totalCopies}</div>
        <div className="text-[10px] text-white/40">
          {totalCopies === 1 ? "Copy" : "Copies"} in circulation
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[17px] top-2 bottom-2 w-px bg-white/10" />

        {events.map((event) => (
          <div key={event.id} className="relative flex gap-3 py-2">
            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#12121a]">
              {iconMap[event.type]}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-xs text-white/70">{event.description}</p>
              <p className="text-[10px] text-white/30">
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
