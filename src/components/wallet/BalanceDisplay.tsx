"use client";

import { useAuthStore } from "@/stores/authStore";
import { formatTokenAmount } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BalanceDisplay() {
  const { isAuthenticated, profile } = useAuthStore();
  const balance = profile?.balance ?? 0;
  const authenticated = isAuthenticated();
  const [pulse, setPulse] = useState(false);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance && authenticated) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevBalance.current = balance;
      return () => clearTimeout(t);
    }
  }, [balance, authenticated]);

  if (!authenticated) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: pulse ? [1, 1.1, 1] : 1,
        }}
        className="flex items-center gap-1.5 rounded-lg bg-[#FFD700]/10 px-3 py-1.5"
      >
        <Coins className="h-4 w-4 text-[#FFD700]" />
        <span className={`text-sm font-bold transition-colors duration-300 ${pulse ? "text-[#FFD700]" : "text-white"}`}>
          {formatTokenAmount(balance)}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
