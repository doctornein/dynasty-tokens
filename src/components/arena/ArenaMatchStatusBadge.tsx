"use client";

import { ArenaMatchStatus } from "@/types";

const statusStyles: Record<ArenaMatchStatus, string> = {
  open: "text-orange-400 bg-orange-400/10",
  matched: "text-blue-400 bg-blue-400/10",
  settled: "text-emerald-400 bg-emerald-400/10",
  voided: "text-red-400 bg-red-400/10",
  cancelled: "text-white/40 bg-white/5",
};

export function ArenaMatchStatusBadge({ status }: { status: ArenaMatchStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
