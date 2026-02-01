"use client";

import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "gold" | "blue" | "purple" | "green" | "orange";
  size?: "sm" | "md" | "lg";
}

const variants = {
  gold: "from-yellow-500 to-amber-600 shadow-amber-500/30 hover:shadow-amber-500/50",
  blue: "from-cyan-400 to-blue-600 shadow-cyan-500/30 hover:shadow-cyan-500/50",
  purple: "from-purple-500 to-violet-700 shadow-purple-500/30 hover:shadow-purple-500/50",
  green: "from-emerald-400 to-green-600 shadow-emerald-500/30 hover:shadow-emerald-500/50",
  orange: "from-orange-500 to-amber-700 shadow-orange-500/30 hover:shadow-orange-500/50",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function GlowButton({ children, variant = "gold", size = "md", className, disabled, ...props }: GlowButtonProps) {
  return (
    <button
      className={cn(
        "relative rounded-xl bg-gradient-to-r font-bold text-white shadow-lg transition-all duration-300",
        "hover:scale-105 hover:shadow-xl active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
