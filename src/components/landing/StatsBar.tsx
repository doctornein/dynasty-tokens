"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { players } from "@/data/players";
import { packs } from "@/data/packs";
import { airdropThresholds } from "@/data/airdropThresholds";

const stats = [
  { label: "Player Cards", value: players.length },
  { label: "Pack Types", value: packs.length },
  { label: "Total Supply", value: packs.reduce((sum, p) => sum + p.totalSupply, 0) },
  { label: "Reward Types", value: airdropThresholds.length },
];

export function StatsBar() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] px-4 py-12">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.15 } },
        }}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            className="text-center"
          >
            <AnimatedCounter
              value={stat.value}
              className="text-3xl font-black text-[#FFD700] md:text-4xl"
            />
            <p className="mt-1 text-sm text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
