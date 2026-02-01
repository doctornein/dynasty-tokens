"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, className, duration = 1 }: AnimatedCounterProps) {
  const springValue = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(springValue, (v) => Math.floor(v).toLocaleString());
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  if (!mounted) return <span className={className}>0</span>;

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
