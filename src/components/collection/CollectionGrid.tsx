"use client";

import { useState, useMemo } from "react";
import { useCollectionStore, getOwnedPlayers } from "@/stores/collectionStore";
import { useRewardStore } from "@/stores/rewardStore";
import { PlayerCard } from "./PlayerCard";
import { PlayerCardModal } from "./PlayerCardModal";
import { Filters } from "./Filters";
import { Search } from "./Search";
import { SortControls, type SortKey } from "./SortControls";
import { Player, OwnedCard } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GlowButton } from "@/components/ui/GlowButton";
import { Package } from "lucide-react";

export function CollectionGrid() {
  const ownedCards = useCollectionStore((s) => s.ownedCards);
  const rewards = useRewardStore((s) => s.rewards);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const ownedPlayers = useMemo(() => getOwnedPlayers(ownedCards), [ownedCards]);

  // Build a map of playerId -> OwnedCard (most recent) for auction listing
  const playerCardMap = useMemo(() => {
    const map = new Map<string, OwnedCard>();
    for (const card of ownedCards) {
      const existing = map.get(card.playerId);
      if (!existing || card.acquiredAt > existing.acquiredAt) {
        map.set(card.playerId, card);
      }
    }
    return map;
  }, [ownedCards]);

  // Build a map of playerId -> acquiredAt (most recent) for sorting
  const acquiredAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of ownedCards) {
      const existing = map.get(card.playerId);
      if (!existing || card.acquiredAt > existing) {
        map.set(card.playerId, card.acquiredAt);
      }
    }
    return map;
  }, [ownedCards]);

  // Build a map of playerId -> reward count
  const rewardCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rewards) {
      map.set(r.playerId, (map.get(r.playerId) ?? 0) + 1);
    }
    return map;
  }, [rewards]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((globalThis as Record<string, unknown>).__searchTimeout as ReturnType<typeof setTimeout>);
    (globalThis as Record<string, unknown>).__searchTimeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  };

  const filtered = useMemo(() => {
    let result = ownedPlayers.filter((p) => {
      if (debouncedSearch && !p.name.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (teamFilter && p.teamAbbr !== teamFilter) return false;
      if (posFilter && p.position !== posFilter) return false;
      return true;
    });

    if (sortBy === "recent") {
      result = [...result].sort((a, b) => {
        const aTime = acquiredAtMap.get(a.id) ?? "";
        const bTime = acquiredAtMap.get(b.id) ?? "";
        return bTime.localeCompare(aTime);
      });
    } else if (sortBy === "rewards") {
      result = [...result].sort((a, b) => {
        return (rewardCountMap.get(b.id) ?? 0) - (rewardCountMap.get(a.id) ?? 0);
      });
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => b.overallRating - a.overallRating);
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [ownedPlayers, debouncedSearch, teamFilter, posFilter, sortBy, acquiredAtMap, rewardCountMap]);

  if (ownedPlayers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="text-6xl">🏀</div>
        <h2 className="text-2xl font-bold text-white">Locker Room Empty</h2>
        <p className="max-w-md text-white/40">
          No players in your locker room yet. Head to the market to buy your first pack and start building your dynasty!
        </p>
        <Link href="/market">
          <GlowButton variant="gold">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Go to Market
            </span>
          </GlowButton>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Search value={search} onChange={handleSearchChange} />
        </div>
        <div className="flex items-center gap-3">
          <SortControls value={sortBy} onChange={setSortBy} />
          <Filters
            selectedTeam={teamFilter}
            onTeamChange={setTeamFilter}
            selectedPosition={posFilter}
            onPositionChange={setPosFilter}
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-white/40">
        Showing {filtered.length} of {ownedPlayers.length} cards
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((player, i) => (
            <motion.div
              key={`${player.id}-${i}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
            >
              <PlayerCard
                player={player}
                onClick={() => {
                  setSelectedPlayer(player);
                  setSelectedCard(playerCardMap.get(player.id) ?? null);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && ownedPlayers.length > 0 && (
        <div className="py-12 text-center text-white/40">
          No cards match your filters. Try adjusting your search.
        </div>
      )}

      <PlayerCardModal
        player={selectedPlayer}
        ownedCard={selectedCard}
        open={!!selectedPlayer}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlayer(null);
            setSelectedCard(null);
          }
        }}
      />
    </div>
  );
}
