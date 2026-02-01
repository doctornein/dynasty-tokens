"use client";

import { GlowButton } from "@/components/ui/GlowButton";
import { formatRelativeTime } from "@/lib/formatters";
import { RefreshCw, Loader2 } from "lucide-react";

interface ScanStatusBarProps {
  isScanning: boolean;
  lastScanAt: string | null;
  playerCount: number;
  onScan: () => void;
}

export function ScanStatusBar({ isScanning, lastScanAt, playerCount, onScan }: ScanStatusBarProps) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-sm text-white/50">
        {isScanning ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" />
            Scanning {playerCount} player{playerCount !== 1 ? "s" : ""}...
          </span>
        ) : lastScanAt ? (
          <span>Last scanned {formatRelativeTime(new Date(lastScanAt))}</span>
        ) : (
          <span>Not yet scanned</span>
        )}
      </div>

      <GlowButton
        variant="blue"
        size="sm"
        onClick={onScan}
        disabled={isScanning || playerCount === 0}
      >
        <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
        Scan
      </GlowButton>
    </div>
  );
}
