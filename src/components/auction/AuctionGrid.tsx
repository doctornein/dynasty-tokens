"use client";

import { useState, useMemo } from "react";
import { Auction } from "@/types";
import { players } from "@/data/players";
import { AuctionCard } from "./AuctionCard";
import { AuctionDetailModal } from "./AuctionDetailModal";
import { AuctionSortControls, type AuctionSortKey } from "./AuctionSortControls";
import { teams } from "@/data/teams";
import { Position } from "@/types";
import { SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const positions: Position[] = ["PG", "SG", "SF", "PF", "C"];

interface AuctionGridProps {
  auctions: Auction[];
}

export function AuctionGrid({ auctions }: AuctionGridProps) {
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [sortBy, setSortBy] = useState<AuctionSortKey>("ending");

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(
      (globalThis as Record<string, unknown>).__auctionSearchTimeout as ReturnType<
        typeof setTimeout
      >
    );
    (globalThis as Record<string, unknown>).__auctionSearchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  const filtered = useMemo(() => {
    let result = auctions;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((a) => {
        const player = players.find((p) => p.id === a.playerId);
        return player?.name.toLowerCase().includes(q);
      });
    }

    if (teamFilter) {
      result = result.filter((a) => {
        const player = players.find((p) => p.id === a.playerId);
        return player?.teamAbbr === teamFilter;
      });
    }

    if (posFilter) {
      result = result.filter((a) => {
        const player = players.find((p) => p.id === a.playerId);
        return player?.position === posFilter;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "ending":
          return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "price_low":
          return (a.currentBid ?? a.startingBid) - (b.currentBid ?? b.startingBid);
        case "price_high":
          return (b.currentBid ?? b.startingBid) - (a.currentBid ?? a.startingBid);
        case "most_bids":
          return b.bidCount - a.bidCount;
        default:
          return 0;
      }
    });

    return result;
  }, [auctions, debouncedSearch, teamFilter, posFilter, sortBy]);

  const selectClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-[#8B5CF6]/50 hover:bg-white/10";

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search auctions..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#8B5CF6]/50 hover:bg-white/10"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AuctionSortControls value={sortBy} onChange={setSortBy} />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.abbr} value={t.abbr}>
                {t.abbr}
              </option>
            ))}
          </select>
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">All Positions</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-white/40">
        {filtered.length} auction{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-white/40">
          No auctions match your filters
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((auction, i) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
              >
                <AuctionCard
                  auction={auction}
                  onClick={() => setSelectedAuction(auction)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AuctionDetailModal
        auction={selectedAuction}
        open={!!selectedAuction}
        onOpenChange={(open) => !open && setSelectedAuction(null)}
      />
    </div>
  );
}
