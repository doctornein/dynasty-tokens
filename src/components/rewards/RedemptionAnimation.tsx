"use client";

import { motion } from "framer-motion";
import { formatTokenAmount } from "@/lib/formatters";
import { useEffect } from "react";

interface RedemptionAnimationProps {
  value: number;
  onComplete: () => void;
}

export function RedemptionAnimation({ value, onComplete }: RedemptionAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particleCount = 20;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 2 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Central value display */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1] }}
        className="text-center"
      >
        <div className="text-4xl font-black text-[#FFD700] drop-shadow-lg">
          +{formatTokenAmount(value)}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-sm text-white/60"
        >
          Added to balance
        </motion.div>
      </motion.div>

      {/* Particles flowing inward then outward */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (360 / particleCount) * i;
        const rad = (angle * Math.PI) / 180;
        const startDist = 200;
        const startX = Math.cos(rad) * startDist;
        const startY = Math.sin(rad) * startDist;
        const size = 4 + Math.random() * 4;

        return (
          <motion.div
            key={i}
            initial={{ x: startX, y: startY, opacity: 0, scale: 1 }}
            animate={{
              x: [startX, 0, 0],
              y: [startY, 0, 0],
              opacity: [0, 1, 0],
              scale: [1, 1.5, 0],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1],
              delay: Math.random() * 0.3,
              ease: "easeInOut",
            }}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: "#FFD700",
              boxShadow: "0 0 8px #FFD700",
            }}
          />
        );
      })}
    </motion.div>
  );
}
