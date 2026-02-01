"use client";

import { Pack } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { PACK_PRODUCTS } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/formatters";
import { BuyPackButton } from "./BuyPackButton";
import { Layers, Star } from "lucide-react";
import { PackProductIcon } from "@/components/ui/PackProductIcon";

interface PackDetailModalProps {
  pack: Pack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackDetailModal({ pack, open, onOpenChange }: PackDetailModalProps) {
  if (!pack) return null;
  const productInfo = PACK_PRODUCTS[pack.product];
  const color = productInfo.color;

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-md">
      {/* Animated gradient header (replaces photo) */}
      <div
        className="relative -mx-6 -mt-6 mb-5 flex h-44 items-center justify-center overflow-hidden rounded-t-2xl"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${color}30 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, ${color}20 0%, transparent 50%),
                       linear-gradient(135deg, ${color}10, #12121a)`,
        }}
      >
        {/* Floating orbs */}
        <div
          className="absolute h-32 w-32 rounded-full opacity-20 blur-2xl animate-pulse"
          style={{ background: color, top: "10%", left: "15%" }}
        />
        <div
          className="absolute h-24 w-24 rounded-full opacity-15 blur-xl"
          style={{
            background: color,
            bottom: "15%",
            right: "10%",
            animation: "pulse 3s ease-in-out infinite 1s",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <PackProductIcon product={pack.product} color={color} className="h-16 w-16" />
          <span className="text-2xl font-black uppercase tracking-wider text-center leading-tight" style={{ color }}>
            {productInfo.name}
          </span>
        </div>

        {/* Fade at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{ background: "linear-gradient(to top, #12121a, transparent)" }}
        />
      </div>

      <p className="mb-5 text-sm text-white/50">{pack.description}</p>

      <div className="mb-5 flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Layers className="h-5 w-5 text-white/40" />
        <span className="text-sm text-white/70">{pack.cardCount} cards per pack</span>
        <span className="ml-auto text-sm font-bold" style={{ color }}>
          {formatTokenAmount(pack.price)}
        </span>
      </div>

      {/* Guaranteed callout for Supernova */}
      {pack.guaranteedMinRating && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#FFD700]/10 p-3">
          <Star className="h-5 w-5 text-[#FFD700]" />
          <span className="text-sm font-bold text-[#FFD700]">
            Guaranteed Star Player
          </span>
        </div>
      )}

      <BuyPackButton pack={pack} />
    </Modal>
  );
}
