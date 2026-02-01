"use client";

import { Auction, Player } from "@/types";
import { players } from "@/data/players";
import { formatTokenAmount } from "@/lib/formatters";
import { AuctionCountdown } from "./AuctionCountdown";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Gavel, Zap, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface AuctionCardProps {
  auction: Auction;
  onClick: () => void;
}

export function AuctionCard({ auction, onClick }: AuctionCardProps) {
  const player = players.find((p) => p.id === auction.playerId);
  const [imgError, setImgError] = useState(false);

  return (
    <GlassPanel
      hover
      className="cursor-pointer overflow-hidden border-[#8B5CF6]/20 transition-all duration-300 hover:border-[#8B5CF6]/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
    >
      <div onClick={onClick}>
        {/* Player image */}
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#8B5CF6]/10 to-transparent">
          {player?.image && !imgError ? (
            <Image
              src={player.image}
              alt={player?.name ?? "Player"}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-16 w-16 text-white/10" strokeWidth={1} />
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 h-16"
            style={{ background: "linear-gradient(to top, rgba(18,18,26,1), transparent)" }}
          />

          {/* Countdown badge */}
          <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            <AuctionCountdown endsAt={auction.endsAt} className="text-white/80" />
          </div>
        </div>

        {/* Info */}
        <div className="p-3 pt-1">
          <h3 className="font-bold text-white truncate">
            {player?.name ?? "Unknown Player"}
          </h3>
          <p className="text-xs text-white/40">
            {player?.teamAbbr ?? ""} {player?.position ? `· ${player.position}` : ""}
            {auction.sellerUsername && ` · ${auction.sellerUsername}`}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-white/30">
                {auction.currentBid ? "Current Bid" : "Starting Bid"}
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-[#8B5CF6]">
                <Gavel className="h-3 w-3" />
                {formatTokenAmount(auction.currentBid ?? auction.startingBid)}
              </div>
            </div>

            {auction.buyNowPrice && (
              <div className="text-right">
                <div className="text-[10px] uppercase text-white/30">Buy Now</div>
                <div className="flex items-center justify-end gap-1 text-sm font-bold text-[#FFD700]">
                  <Zap className="h-3 w-3" />
                  {formatTokenAmount(auction.buyNowPrice)}
                </div>
              </div>
            )}
          </div>

          {auction.bidCount > 0 && (
            <div className="mt-2 text-[10px] text-white/30">
              {auction.bidCount} bid{auction.bidCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
