"use client";

import { useState, useEffect, useCallback } from "react";
import { Player, PackProduct } from "@/types";
import { usePackOpening } from "@/hooks/usePackOpening";
import { PackTearAnimation } from "./PackTearAnimation";
import { CardReveal } from "./CardReveal";
import { RevealSummary } from "./RevealSummary";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";
import { AnimatePresence, motion } from "framer-motion";

interface PackOpeningSequenceProps {
  cards: Player[];
  product: PackProduct;
}

export function PackOpeningSequence({ cards, product }: PackOpeningSequenceProps) {
  const {
    phase,
    currentCardIndex,
    currentCard,
    isLastCard,
    onTearComplete,
    revealNextCard,
  } = usePackOpening(cards);

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [currentCardFlipped, setCurrentCardFlipped] = useState(false);
  const [flipTrigger, setFlipTrigger] = useState(0);

  const advance = useCallback(() => {
    if (phase === "revealing") {
      if (currentCardFlipped) {
        setCurrentCardFlipped(false);
        revealNextCard();
      } else {
        // Trigger a flip from the parent by bumping the counter
        setFlipTrigger((n) => n + 1);
      }
    }
  }, [phase, currentCardFlipped, revealNextCard]);

  const handleBackgroundClick = () => {
    if (phase === "revealing" && currentCardFlipped) {
      setCurrentCardFlipped(false);
      revealNextCard();
    }
  };

  // Arrow key / space support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when a modal is open
      if (detailPlayer) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, detailPlayer]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center px-4"
      onClick={handleBackgroundClick}
    >
      <AnimatePresence mode="wait">
        {(phase === "idle" || phase === "tearing") && (
          <motion.div
            key="tear"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PackTearAnimation product={product} onTearComplete={onTearComplete} />
          </motion.div>
        )}

        {phase === "revealing" && currentCard && (
          <motion.div
            key={`card-${currentCardIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="mb-4 text-center text-sm text-white/40">
              Card {currentCardIndex + 1} of {cards.length}
            </div>
            <CardReveal
              player={currentCard}
              onNext={() => { setCurrentCardFlipped(false); revealNextCard(); }}
              onViewDetails={() => setDetailPlayer(currentCard)}
              onFlipped={() => setCurrentCardFlipped(true)}
              flipTrigger={flipTrigger}
              index={currentCardIndex}
              isLastCard={isLastCard}
            />
          </motion.div>
        )}

        {phase === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RevealSummary cards={cards} />
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerCardModal
        player={detailPlayer}
        open={!!detailPlayer}
        onOpenChange={(open) => !open && setDetailPlayer(null)}
      />
    </div>
  );
}
