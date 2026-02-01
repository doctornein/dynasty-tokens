"use client";

import { PackGrid } from "@/components/market/PackGrid";
import { AuctionHouse } from "@/components/auction/AuctionHouse";
import { Store } from "lucide-react";

export default function MarketPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Store className="h-8 w-8 text-[#FFD700]" />
        <div>
          <h1 className="text-3xl font-bold text-white">Pack Market</h1>
          <p className="text-sm text-white/40">Choose a product and discover your next star player</p>
        </div>
      </div>
      <PackGrid />

      {/* Divider */}
      <div className="my-12 border-t border-white/10" />

      {/* Auction House */}
      <AuctionHouse />
    </div>
  );
}
