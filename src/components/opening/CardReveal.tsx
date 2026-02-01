"use client";

import { useState, useEffect, useRef } from "react";
import Image, { ImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@/types";
import { CARD_COLORS } from "@/lib/constants";
import { RevealBurst } from "./RevealBurst";
import { cn } from "@/lib/cn";
import { User, Crown, Eye, ArrowRight, LayoutGrid } from "lucide-react";

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

interface CardRevealProps {
  player: Player;
  onNext: () => void;
  onViewDetails: () => void;
  onFlipped?: () => void;
  flipTrigger?: number;
  index: number;
  isLastCard: boolean;
}

export function CardReveal({ player, onNext, onViewDetails, onFlipped, flipTrigger, index, isLastCard }: CardRevealProps) {
  const [flipped, setFlipped] = useState(false);
  const isElite = player.overallRating >= 90;
  const initialTrigger = useRef(flipTrigger);

  // Respond to external flip trigger (arrow key / space)
  useEffect(() => {
    if (flipTrigger !== undefined && flipTrigger !== initialTrigger.current && !flipped) {
      setFlipped(true);
      onFlipped?.();
    }
  }, [flipTrigger, flipped, onFlipped]);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!flipped) {
      setFlipped(true);
      onFlipped?.();
    } else {
      onViewDetails();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.p
            key="reveal-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-white/40"
          >
            Tap to reveal card {index + 1}
          </motion.p>
        ) : (
          <motion.p
            key="details-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/40"
          >
            Tap card to view details
          </motion.p>
        )}
      </AnimatePresence>

      <div className="perspective-[1000px]" style={{ perspective: "1000px" }}>
        <motion.button
          onClick={handleCardClick}
          initial={{ rotateY: 0 }}
          animate={{
            rotateY: flipped ? 180 : 0,
            y: flipped ? [0, -6, 0] : 0,
          }}
          transition={{
            rotateY: { type: "spring", stiffness: 200, damping: 25 },
            y: flipped ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
          }}
          whileHover={flipped ? { scale: 1.03 } : {}}
          className="relative h-[440px] w-72"
          style={{ transformStyle: "preserve-3d" }}
          aria-label={flipped ? `View details for ${player.name}` : `Reveal card ${index + 1}`}
        >
          {/* Card back */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-2xl border-2"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #1a1a2e, #0a0a0f)",
              borderColor: isElite ? "#FFD700" : "#2a2a3e",
            }}
            animate={
              isElite
                ? {
                    boxShadow: [
                      "0 0 15px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 165, 0, 0.2)",
                      "0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 165, 0, 0.4)",
                      "0 0 15px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 165, 0, 0.2)",
                    ],
                  }
                : {}
            }
            transition={isElite ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            <div className="text-center">
              <Crown
                className={cn(
                  "mx-auto mb-2 h-12 w-12",
                  isElite ? "text-[#FFD700]/80" : "text-[#FFD700]/30"
                )}
              />
              <div
                className={cn(
                  "text-xs",
                  isElite ? "font-bold text-[#FFD700]" : "text-white/20"
                )}
              >
                TAP TO REVEAL
              </div>
            </div>
          </motion.div>

          {/* Card front */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border-2"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderColor: `${CARD_COLORS.blue}80`,
              boxShadow: `0 0 20px ${CARD_COLORS.glow}, 0 0 40px ${CARD_COLORS.glowRed}`,
            }}
          >
            {/* Headshot area */}
            <div
              className="relative h-56 w-full"
              style={{
                background: `linear-gradient(135deg, ${CARD_COLORS.blue}15, ${CARD_COLORS.red}05)`,
              }}
            >
              {player.image ? (
                <HeadshotImage
                  src={player.image}
                  alt={player.name}
                  fill
                  className="object-cover object-top"
                  sizes="288px"
                  fallbackClassName="h-24 w-24"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-24 w-24 text-white/10" strokeWidth={1} />
                </div>
              )}

              {/* Gradient fade */}
              <div
                className="absolute inset-x-0 bottom-0 h-20"
                style={{
                  background: `linear-gradient(to top, ${CARD_COLORS.blue}10, transparent)`,
                }}
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
                {player.position}
              </div>

              {/* Jersey number */}
              <div className="absolute right-3 top-3 text-2xl font-black text-white/10">
                #{player.jerseyNumber}
              </div>
            </div>

            {/* Info section */}
            <div
              className="flex h-[calc(100%-14rem)] flex-col items-center justify-center px-4 text-center"
              style={{
                background: `linear-gradient(135deg, ${CARD_COLORS.blue}08, #12121a)`,
              }}
            >
              <h3 className="mb-1 text-lg font-bold text-white">{player.name}</h3>
              <p className="mb-3 text-xs text-white/50">{player.team}</p>

              {/* Quick stats */}
              <div className="mt-3 flex gap-4 text-[11px] text-white/40">
                <div className="text-center">
                  <div className="font-mono font-bold text-white/60">{player.stats.ppg.toFixed(1)}</div>
                  <div>PPG</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-white/60">{player.stats.rpg.toFixed(1)}</div>
                  <div>RPG</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-white/60">{player.stats.apg.toFixed(1)}</div>
                  <div>APG</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-white/60">{player.stats.fgPct.toFixed(1)}%</div>
                  <div>FG%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Burst on flip */}
      <AnimatePresence>
        {flipped && <RevealBurst rating={player.overallRating} />}
      </AnimatePresence>

      {/* Action buttons after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="flex items-center gap-1.5 rounded-xl bg-[#FFD700]/10 px-4 py-2.5 text-sm font-bold text-[#FFD700] transition-colors hover:bg-[#FFD700]/20"
            >
              {isLastCard ? (
                <>
                  <LayoutGrid className="h-4 w-4" />
                  View All Cards
                </>
              ) : (
                <>
                  Next Card
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
