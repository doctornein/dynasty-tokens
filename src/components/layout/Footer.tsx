"use client";

import { Crown } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0f]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#FFD700]" />
          <span className="text-sm font-semibold text-white/60">
            Dynasty<span className="text-[#FFD700]/60">Tokens</span>
          </span>
        </div>
        <p className="text-xs text-white/30">
          Free to play. This is a demo project &mdash; no real currency is involved.
        </p>
        <div className="flex gap-4 text-xs text-white/30">
          <span>Pack Market</span>
          <span>&middot;</span>
          <span>Locker Room</span>
          <span>&middot;</span>
          <span>Rewards</span>
        </div>
      </div>
    </footer>
  );
}
