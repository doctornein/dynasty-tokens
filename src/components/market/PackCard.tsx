"use client";

import { Pack } from "@/types";
import { AuraEffect } from "@/components/ui/AuraEffect";
import { PACK_PRODUCTS } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/formatters";
import { Layers, Star } from "lucide-react";
import { PackProductIcon } from "@/components/ui/PackProductIcon";

interface PackCardProps {
  pack: Pack;
  onClick: () => void;
}

export function PackCard({ pack, onClick }: PackCardProps) {
  const productInfo = PACK_PRODUCTS[pack.product];
  const color = productInfo.color;

  return (
    <AuraEffect color={color} className="group cursor-pointer transition-all duration-300 hover:scale-[1.03]">
      <button
        onClick={onClick}
        className="flex w-full flex-col rounded-2xl bg-[#12121a] p-5 text-left"
      >
        {/* Animated gradient visual (replaces photo) */}
        <div
          className="relative mb-4 flex h-44 items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${color}30 0%, transparent 50%),
                         radial-gradient(ellipse at 70% 80%, ${color}20 0%, transparent 50%),
                         linear-gradient(135deg, ${color}08, #0a0a0f)`,
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

          {/* Central icon + name */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="transition-transform duration-500 group-hover:scale-110">
              <PackProductIcon product={pack.product} color={color} className="h-14 w-14" />
            </div>
            <span className="text-lg font-black uppercase tracking-wider text-center leading-tight" style={{ color }}>
              {productInfo.name}
            </span>
          </div>

          {/* Product badge */}
          <div
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold uppercase backdrop-blur-sm"
            style={{ color, backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
          >
            {pack.cardCount} cards
          </div>
        </div>

        {/* Pack info */}
        <h3 className="mb-1 text-lg font-bold text-white">{pack.name}</h3>
        <p className="mb-3 line-clamp-2 text-xs text-white/40">{pack.description}</p>

        {/* Cards count */}
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-white/40" />
          <span className="text-sm text-white/60">{pack.cardCount} cards</span>
        </div>

        {/* Guaranteed badge for Supernova */}
        {pack.guaranteedMinRating && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#FFD700]/10 px-3 py-1.5">
            <Star className="h-4 w-4 text-[#FFD700]" />
            <span className="text-xs font-bold text-[#FFD700]">
              GUARANTEED STAR PLAYER
            </span>
          </div>
        )}

        {/* Price */}
        <div
          className="mt-auto rounded-lg py-2 text-center text-sm font-bold"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {formatTokenAmount(pack.price)}
        </div>
      </button>
    </AuraEffect>
  );
}
