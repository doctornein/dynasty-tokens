"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { formatTokenAmount } from "@/lib/formatters";
import { User, CreditCard, Package, Coins, Crown, ArrowUpDown } from "lucide-react";

export interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  balance: number;
  packs_opened: number;
  created_at: string;
  card_count: number;
}

type SortKey = "card_count" | "packs_opened" | "balance";

const sortOptions: { key: SortKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "card_count", label: "Cards", icon: CreditCard },
  { key: "packs_opened", label: "Packs", icon: Package },
  { key: "balance", label: "Balance", icon: Coins },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-[#FFD700]" />;
  if (rank === 2) return <Crown className="h-5 w-5 text-[#C0C0C0]" />;
  if (rank === 3) return <Crown className="h-5 w-5 text-[#CD7F32]" />;
  return <span className="text-sm font-bold text-white/30">{rank}</span>;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("card_count");

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [entries, sortBy]);

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center text-white/40">
        No players yet. Be the first to sign up!
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="mb-4 flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-white/30" />
        <span className="text-xs text-white/30">Sort by</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sortBy === opt.key
                ? "bg-[#FFD700]/10 text-[#FFD700]"
                : "text-white/40 hover:bg-white/5 hover:text-white/60"
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((entry, i) => (
          <Link key={entry.id} href={`/u/${entry.username}`}>
            <GlassPanel hover className="flex items-center gap-4 p-4">
              {/* Rank */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                <RankBadge rank={i + 1} />
              </div>

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                {entry.avatar_url ? (
                  <Image
                    src={entry.avatar_url}
                    alt={entry.display_name ?? entry.username}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white/20" />
                )}
              </div>

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {entry.display_name ?? entry.username}
                </p>
                <p className="text-xs text-white/30">@{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="hidden items-center gap-6 sm:flex">
                <Stat
                  icon={CreditCard}
                  value={entry.card_count}
                  label="cards"
                  highlight={sortBy === "card_count"}
                />
                <Stat
                  icon={Package}
                  value={entry.packs_opened}
                  label="packs"
                  highlight={sortBy === "packs_opened"}
                />
                <Stat
                  icon={Coins}
                  value={formatTokenAmount(entry.balance)}
                  label=""
                  highlight={sortBy === "balance"}
                />
              </div>

              {/* Mobile: show only the sorted stat */}
              <div className="sm:hidden">
                {sortBy === "card_count" && (
                  <span className="text-sm font-bold text-[#FFD700]">{entry.card_count} cards</span>
                )}
                {sortBy === "packs_opened" && (
                  <span className="text-sm font-bold text-[#FFD700]">{entry.packs_opened} packs</span>
                )}
                {sortBy === "balance" && (
                  <span className="text-sm font-bold text-[#FFD700]">{formatTokenAmount(entry.balance)}</span>
                )}
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  highlight: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${highlight ? "text-[#FFD700]" : "text-white/40"}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className={`text-sm font-medium ${highlight ? "font-bold" : ""}`}>
        {value}{label ? ` ${label}` : ""}
      </span>
    </div>
  );
}
