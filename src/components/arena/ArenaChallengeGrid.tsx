"use client";

import { useMemo, useState } from "react";
import { ArenaMatch } from "@/types";
import { ArenaChallengeCard } from "./ArenaChallengeCard";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ArenaChallengeGridProps {
  matches: ArenaMatch[];
  onSelectMatch: (match: ArenaMatch) => void;
}

export function ArenaChallengeGrid({ matches, onSelectMatch }: ArenaChallengeGridProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = matches;

    if (typeFilter !== "all") {
      result = result.filter((m) => m.gameType === typeFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.challengerUsername.toLowerCase().includes(q) ||
          m.statCategories.some((c) => c.toLowerCase().includes(q))
      );
    }

    return result;
  }, [matches, search, typeFilter]);

  const selectClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50";

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Types</option>
          <option value="1v1">1v1</option>
          <option value="3v3">3v3</option>
          <option value="5v5">5v5</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-white/40">
          No open challenges found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
              >
                <ArenaChallengeCard
                  match={match}
                  onClick={() => onSelectMatch(match)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
