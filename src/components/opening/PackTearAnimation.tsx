"use client";

import { motion } from "framer-motion";
import { PACK_PRODUCTS } from "@/lib/constants";
import { PackProduct } from "@/types";
import { PackProductIcon } from "@/components/ui/PackProductIcon";

interface PackTearAnimationProps {
  product: PackProduct;
  onTearComplete: () => void;
}

export function PackTearAnimation({ product, onTearComplete }: PackTearAnimationProps) {
  const productInfo = PACK_PRODUCTS[product];
  const color = productInfo.color;

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg text-white/50"
      >
        Tap to open!
      </motion.p>

      <button
        onClick={onTearComplete}
        className="relative focus:outline-none"
        aria-label="Open pack"
      >
        {/* Left half */}
        <motion.div
          initial={{ x: 0, rotate: 0, opacity: 1 }}
          whileTap={{ x: -120, rotate: -15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute left-0 top-0 h-64 w-32 overflow-hidden rounded-l-2xl"
          style={{ background: `linear-gradient(135deg, ${color}40, ${color}15)` }}
        >
          <div className="flex h-full items-center justify-end pr-0 -mr-8">
            <PackProductIcon product={product} color={color} className="h-16 w-16" />
          </div>
        </motion.div>

        {/* Right half */}
        <motion.div
          initial={{ x: 0, rotate: 0, opacity: 1 }}
          whileTap={{ x: 120, rotate: 15, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute left-32 top-0 h-64 w-32 overflow-hidden rounded-r-2xl"
          style={{ background: `linear-gradient(225deg, ${color}40, ${color}15)` }}
        >
          <div className="flex h-full items-center justify-start pl-0 -ml-8">
            <PackProductIcon product={product} color={color} className="h-16 w-16" />
          </div>
        </motion.div>

        {/* Full pack (before tear) */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, opacity: 0 }}
          onTap={onTearComplete}
          className="relative flex h-64 w-64 flex-col items-center justify-center rounded-2xl border-2"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}08)`,
            borderColor: `${color}60`,
            boxShadow: `0 0 30px ${color}20, 0 0 60px ${color}10`,
          }}
        >
          <div className="mb-3">
            <PackProductIcon product={product} color={color} className="h-20 w-20" />
          </div>
          <span className="text-base font-bold text-center leading-tight" style={{ color }}>
            {productInfo.name}
          </span>
        </motion.div>
      </button>

      {/* Flash effect on tear */}
      <motion.div
        initial={{ opacity: 0 }}
        whileTap={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none fixed inset-0 z-50 bg-white"
      />
    </div>
  );
}
