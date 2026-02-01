"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Player } from "@/types";
import { CARD_COLORS } from "@/lib/constants";
import { GlowButton } from "@/components/ui/GlowButton";
import { getBestCard } from "@/lib/packEngine";
import { cn } from "@/lib/cn";
import { Crown, ArrowRight, Package, User } from "lucide-react";

function HeadshotImage({ fallbackClassName, ...props }: ImageProps & { fallbackClassName?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <User className={cn("text-white/10", fallbackClassName)} strokeWidth={1} />
      </div>
    );
  }
  return <Image {...props} onError={() => setError(true)} />;
}

interface RevealSummaryProps {
  cards: Player[];
}

export function RevealSummary({ cards }: RevealSummaryProps) {
  const bestCard = getBestCard(cards);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <h2 className="text-2xl font-bold text-white">Pack Opened!</h2>

      {/* Best card highlight */}
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-[#FFD700]">
          <Crown className="h-4 w-4" />
          Best Pull
        </div>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-64 overflow-hidden rounded-2xl border-2"
          style={{
            borderColor: `${CARD_COLORS.blue}80`,
            boxShadow: `0 0 30px ${CARD_COLORS.glow}, 0 0 20px ${CARD_COLORS.glowRed}`,
          }}
        >
          {/* Headshot */}
          <div
            className="relative h-44 w-full"
            style={{
              background: `linear-gradient(135deg, ${CARD_COLORS.blue}15, ${CARD_COLORS.red}05)`,
            }}
          >
            {bestCard.image ? (
              <HeadshotImage
                src={bestCard.image}
                alt={bestCard.name}
                fill
                className="object-cover object-top"
                sizes="256px"
                fallbackClassName="h-20 w-20"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-20 w-20 text-white/10" strokeWidth={1} />
              </div>
            )}
            <div
              className="absolute inset-x-0 bottom-0 h-16"
              style={{ background: `linear-gradient(to top, #12121a, transparent)` }}
            />
            {/* Position badge */}
            <div
              className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-xs font-bold backdrop-blur-sm"
              style={{
                color: CARD_COLORS.blue,
                backgroundColor: `${CARD_COLORS.blue}25`,
                border: `1px solid ${CARD_COLORS.blue}30`,
              }}
            >
              {bestCard.position}
            </div>
            {/* Jersey number */}
            <div className="absolute right-3 top-3 text-2xl font-black text-white/10">
              #{bestCard.jerseyNumber}
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#12121a] px-5 pb-5 pt-2 text-center">
            <h3 className="text-xl font-bold text-white">{bestCard.name}</h3>
            <p className="mb-2 text-sm text-white/50">{bestCard.team}</p>

            <div className="mt-3 flex justify-center gap-5 text-xs text-white/40">
              <div className="text-center">
                <div className="font-mono font-bold text-white/60">{bestCard.stats.ppg.toFixed(1)}</div>
                <div>PPG</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-white/60">{bestCard.stats.rpg.toFixed(1)}</div>
                <div>RPG</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-white/60">{bestCard.stats.apg.toFixed(1)}</div>
                <div>APG</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* All cards */}
      <div className="w-full">
        <h3 className="mb-3 text-center text-sm font-semibold text-white/50">All Cards</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="w-32 overflow-hidden rounded-xl border"
              style={{
                borderColor: `${CARD_COLORS.blue}40`,
              }}
            >
              {/* Mini headshot */}
              <div
                className="relative h-20 w-full"
                style={{ background: `${CARD_COLORS.blue}08` }}
              >
                {card.image ? (
                  <HeadshotImage
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                    fallbackClassName="h-10 w-10"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-10 w-10 text-white/10" strokeWidth={1} />
                  </div>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 h-8"
                  style={{ background: `linear-gradient(to top, #12121a, transparent)` }}
                />
              </div>

              <div className="bg-[#12121a] px-2 pb-2 pt-0.5 text-center">
                <span className="text-xs font-bold text-white/70 line-clamp-1">{card.name}</span>
                <div className="mt-0.5 text-[9px] text-white/30">{card.teamAbbr}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/collection">
          <GlowButton variant="blue" size="md">
            <span className="flex items-center gap-2">
              Locker Room <ArrowRight className="h-4 w-4" />
            </span>
          </GlowButton>
        </Link>
        <Link href="/market">
          <GlowButton variant="gold" size="md">
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Buy More Packs
            </span>
          </GlowButton>
        </Link>
      </div>
    </motion.div>
  );
}
