"use client";

import { packs } from "@/data/packs";
import { PackCard } from "@/components/market/PackCard";
import { PackDetailModal } from "@/components/market/PackDetailModal";
import { useState } from "react";
import { Pack } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FeaturedPacks() {
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Pack Market</h2>
          <Link
            href="/market"
            className="flex items-center gap-1 text-sm text-[#FFD700] transition-colors hover:text-[#FFD700]/80"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {packs.map((pack) => (
            <motion.div
              key={pack.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <PackCard pack={pack} onClick={() => setSelectedPack(pack)} />
            </motion.div>
          ))}
        </motion.div>

        <PackDetailModal
          pack={selectedPack}
          open={!!selectedPack}
          onOpenChange={(open) => !open && setSelectedPack(null)}
        />
      </div>
    </section>
  );
}
