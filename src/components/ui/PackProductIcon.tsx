"use client";

import { PackProduct } from "@/types";
import { Star, Trophy } from "lucide-react";

/** Simple basketball SVG — circle with seam lines */
function BasketballIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="M4.93 4.93a14.5 14.5 0 0 1 0 14.14" />
      <path d="M19.07 4.93a14.5 14.5 0 0 0 0 14.14" />
    </svg>
  );
}

/** Cluster of Star icons with staggered animation */
function StarsCluster({ className, color }: { className?: string; color: string }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Star
        className="h-full w-full"
        style={{ color, filter: `drop-shadow(0 0 6px ${color}80)` }}
        fill={color}
        strokeWidth={0}
      />
      <Star
        className="absolute -right-3 -top-2 h-5 w-5 animate-pulse"
        style={{ color, opacity: 0.7 }}
        fill={color}
        strokeWidth={0}
      />
      <Star
        className="absolute -bottom-1 -left-3 h-4 w-4"
        style={{ color, opacity: 0.5, animation: "pulse 2s ease-in-out infinite 0.5s" }}
        fill={color}
        strokeWidth={0}
      />
    </div>
  );
}

interface PackProductIconProps {
  product: PackProduct;
  color: string;
  className?: string;
}

export function PackProductIcon({ product, color, className = "h-12 w-12" }: PackProductIconProps) {
  switch (product) {
    case "starter":
      return <BasketballIcon className={className} style={{ color }} />;
    case "allstar":
      return <StarsCluster className={className} color={color} />;
    case "dynasty":
      return (
        <Trophy
          className={className}
          style={{ color, filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      );
  }
}
