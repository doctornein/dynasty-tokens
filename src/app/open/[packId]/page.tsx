"use client";

import { use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Player, PackProduct } from "@/types";
import { useMarketStore } from "@/stores/marketStore";
import { PackOpeningSequence } from "@/components/opening/PackOpeningSequence";

export default function OpenPackPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = use(params);
  const router = useRouter();

  // Read cards from the store once and cache in a ref so strict mode re-mounts don't lose them
  const cardsRef = useRef<Player[] | null>(null);
  const productRef = useRef<PackProduct>("starter");

  if (cardsRef.current === null) {
    const store = useMarketStore.getState();
    if (store.lastOpenedCards && store.lastOpenedPackId === packId) {
      cardsRef.current = store.lastOpenedCards;
      const pack = store.getPack(packId);
      if (pack) productRef.current = pack.product;
      store.clearLastOpened();
    }
  }

  if (!cardsRef.current) {
    router.replace("/market");
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/40">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PackOpeningSequence cards={cardsRef.current} product={productRef.current} />
    </div>
  );
}
