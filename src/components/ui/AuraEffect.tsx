"use client";

import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface AuraEffectProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function AuraEffect({ children, color = "#3B82F6", className }: AuraEffectProps) {
  return (
    <div className={cn("aura-wrapper relative rounded-2xl", className)}>
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-60 animate-aura-rotate"
        style={{
          background: `conic-gradient(from var(--aura-angle, 0deg), ${color}, #EF4444, ${color}, #EF4444, ${color})`,
        }}
      />
      {/* Inner content */}
      <div className="relative rounded-2xl">
        {children}
      </div>
    </div>
  );
}
