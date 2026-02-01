"use client";

import { useState, useCallback } from "react";
import { Player, OpeningPhase } from "@/types";

export function usePackOpening(cards: Player[]) {
  const [phase, setPhase] = useState<OpeningPhase>("idle");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Player[]>([]);

  const startTearing = useCallback(() => {
    setPhase("tearing");
  }, []);

  const onTearComplete = useCallback(() => {
    setPhase("revealing");
    setCurrentCardIndex(0);
    setRevealedCards([]);
  }, []);

  const revealNextCard = useCallback(() => {
    if (currentCardIndex < cards.length) {
      setRevealedCards((prev) => [...prev, cards[currentCardIndex]]);
      setCurrentCardIndex((prev) => prev + 1);
    }
    if (currentCardIndex >= cards.length - 1) {
      setTimeout(() => setPhase("summary"), 800);
    }
  }, [currentCardIndex, cards]);

  const reset = useCallback(() => {
    setPhase("idle");
    setCurrentCardIndex(0);
    setRevealedCards([]);
  }, []);

  return {
    phase,
    currentCardIndex,
    revealedCards,
    currentCard: cards[currentCardIndex] ?? null,
    isLastCard: currentCardIndex >= cards.length - 1,
    startTearing,
    onTearComplete,
    revealNextCard,
    reset,
  };
}
