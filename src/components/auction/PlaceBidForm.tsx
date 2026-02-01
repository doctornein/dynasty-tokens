"use client";

import { useState } from "react";
import { useAuctionStore } from "@/stores/auctionStore";
import { useAuthStore } from "@/stores/authStore";
import { GlowButton } from "@/components/ui/GlowButton";
import { formatTokenAmount } from "@/lib/formatters";
import { Auction } from "@/types";

interface PlaceBidFormProps {
  auction: Auction;
  onSuccess: () => void;
}

export function PlaceBidForm({ auction, onSuccess }: PlaceBidFormProps) {
  const minBid = auction.currentBid
    ? auction.currentBid + 1
    : auction.startingBid;
  const [amount, setAmount] = useState(String(minBid));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const placeBid = useAuctionStore((s) => s.placeBid);
  const balance = useAuthStore((s) => s.getBalance());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < minBid) {
      setError(`Bid must be at least ${formatTokenAmount(minBid)}`);
      return;
    }
    if (numAmount > balance) {
      setError("Insufficient balance");
      return;
    }

    setSubmitting(true);
    const result = await placeBid(auction.id, numAmount);
    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? "Failed to place bid");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-white/40">
          Bid Amount (min {formatTokenAmount(minBid)})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minBid}
          step="1"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#8B5CF6]/50"
        />
      </div>
      <div className="text-xs text-white/30">
        Your balance: {formatTokenAmount(balance)}
      </div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <GlowButton
        type="submit"
        variant="purple"
        size="sm"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? "Placing Bid..." : "Place Bid"}
      </GlowButton>
    </form>
  );
}
