"use client";

import { useState, useEffect } from "react";
import { formatCountdown } from "@/lib/formatters";
import { cn } from "@/lib/cn";

interface AuctionCountdownProps {
  endsAt: string;
  className?: string;
}

export function AuctionCountdown({ endsAt, className }: AuctionCountdownProps) {
  const [text, setText] = useState(() => formatCountdown(endsAt));

  useEffect(() => {
    const id = setInterval(() => {
      setText(formatCountdown(endsAt));
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const end = new Date(endsAt).getTime();
  const remaining = end - Date.now();
  const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <span
      className={cn(
        "tabular-nums",
        isUrgent && "text-red-400 animate-pulse",
        className
      )}
    >
      {text}
    </span>
  );
}
