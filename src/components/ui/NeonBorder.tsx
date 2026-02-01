"use client";

import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface NeonBorderProps {
  children: ReactNode;
  color?: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function NeonBorder({ children, color = "#00D4FF", className, intensity = "medium" }: NeonBorderProps) {
  const glowSize = { low: "4px", medium: "8px", high: "16px" }[intensity];
  const glowSizeOuter = { low: "8px", medium: "16px", high: "32px" }[intensity];

  return (
    <div
      className={cn("relative rounded-2xl", className)}
      style={{
        boxShadow: `0 0 ${glowSize} ${color}40, 0 0 ${glowSizeOuter} ${color}20, inset 0 0 ${glowSize} ${color}10`,
        border: `1px solid ${color}60`,
      }}
    >
      {children}
    </div>
  );
}
