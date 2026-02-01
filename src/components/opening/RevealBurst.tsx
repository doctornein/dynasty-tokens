"use client";

import { motion } from "framer-motion";
import { CARD_COLORS } from "@/lib/constants";

interface RevealBurstProps {
  rating: number;
}

export function RevealBurst({ rating }: RevealBurstProps) {
  // More particles for higher rated players
  const count = rating >= 90 ? 30 : rating >= 80 ? 20 : rating >= 70 ? 12 : 6;
  const colors = [CARD_COLORS.blue, CARD_COLORS.red];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 2, delay: 0.5 }}
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
    >
      {/* Central flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute h-32 w-32 rounded-full"
        style={{ background: `radial-gradient(circle, ${CARD_COLORS.blue}60, ${CARD_COLORS.red}30, transparent)` }}
      />

      {/* Particles */}
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        const distance = 100 + Math.random() * 150;
        const size = rating >= 90 ? 6 + Math.random() * 6 : 3 + Math.random() * 4;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * distance;
        const y = Math.sin(rad) * distance;
        const color = colors[i % colors.length];

        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{
              duration: 0.8 + Math.random() * 0.6,
              ease: "easeOut",
              delay: Math.random() * 0.2,
            }}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              boxShadow: `0 0 ${size * 2}px ${color}`,
            }}
          />
        );
      })}

      {/* Extra ring for 90+ rated */}
      {rating >= 90 && (
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 5, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute h-24 w-24 rounded-full border-2"
          style={{ borderColor: CARD_COLORS.blue }}
        />
      )}
    </motion.div>
  );
}
