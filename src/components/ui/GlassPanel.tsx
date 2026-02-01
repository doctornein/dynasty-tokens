"use client";

import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassPanel({ children, className, hover = false }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        hover && "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]",
        className
      )}
    >
      {children}
    </div>
  );
}
