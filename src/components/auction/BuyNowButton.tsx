"use client";

import { useState } from "react";
import { useAuctionStore } from "@/stores/auctionStore";
import { useAuthStore } from "@/stores/authStore";
import { GlowButton } from "@/components/ui/GlowButton";
import { formatTokenAmount } from "@/lib/formatters";
import { Auction } from "@/types";
import { Zap } from "lucide-react";

interface BuyNowButtonProps {
  auction: Auction;
  onSuccess: () => void;
}

export function BuyNowButton({ auction, onSuccess }: BuyNowButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const buyNow = useAuctionStore((s) => s.buyNow);
  const balance = useAuthStore((s) => s.getBalance());

  if (!auction.buyNowPrice) return null;

  const canAfford = balance >= auction.buyNowPrice;

  const handleBuy = async () => {
    setError("");
    setSubmitting(true);
    const result = await buyNow(auction.id);
    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? "Failed to buy");
    }
  };

  return (
    <div className="space-y-2">
      <GlowButton
        variant="gold"
        size="sm"
        disabled={submitting || !canAfford}
        onClick={handleBuy}
        className="w-full"
      >
        <span className="flex items-center justify-center gap-2">
          <Zap className="h-4 w-4" />
          {submitting
            ? "Buying..."
            : `Buy Now — ${formatTokenAmount(auction.buyNowPrice)}`}
        </span>
      </GlowButton>
      {!canAfford && (
        <div className="text-xs text-red-400 text-center">Insufficient balance</div>
      )}
      {error && <div className="text-xs text-red-400 text-center">{error}</div>}
    </div>
  );
}
