"use client";

import { useState } from "react";
import { useMarketStore } from "@/stores/marketStore";
import { PackCard } from "./PackCard";
import { PackDetailModal } from "./PackDetailModal";
import { Pack } from "@/types";

export function PackGrid() {
  const packs = useMarketStore((s) => s.packs);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  return (
    <>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} onClick={() => setSelectedPack(pack)} />
        ))}
      </div>
      <PackDetailModal
        pack={selectedPack}
        open={!!selectedPack}
        onOpenChange={(open) => !open && setSelectedPack(null)}
      />
    </>
  );
}
