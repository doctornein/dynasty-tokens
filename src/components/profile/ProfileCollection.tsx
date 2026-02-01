"use client";

import { useState, useMemo } from "react";
import { PlayerCard } from "@/components/collection/PlayerCard";
import { PlayerCardModal } from "@/components/collection/PlayerCardModal";
import { Filters } from "@/components/collection/Filters";
import { Search } from "@/components/collection/Search";
import { SortControls, type SortKey } from "@/components/collection/SortControls";
import { getOwnedPlayers } from "@/stores/collectionStore";
import type { OwnedCard, Player } from "@/types";

interface ProfileCollectionProps {
  cards: OwnedCard[];
}

export function ProfileCollection({ cards }: ProfileCollectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");

  const ownedPlayers = useMemo(() => getOwnedPlayers(cards), [cards]);

  const acquiredAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of cards) {
      const existing = map.get(card.playerId);
      if (!existing || card.acquiredAt > existing) {
        map.set(card.playerId, card.acquiredAt);
      }
    }
    return map;
  }, [cards]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((globalThis as Record<string, unknown>).__profileSearchTimeout as ReturnType<typeof setTimeout>);
    (globalThis as Record<string, unknown>).__profileSearchTimeout = setTimeout(() => {
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
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => b.overallRating - a.overallRating);
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [ownedPlayers, debouncedSearch, teamFilter, posFilter, sortBy, acquiredAtMap]);

  if (ownedPlayers.length === 0) {
    return (
      <div className="py-20 text-center text-white/40">
        No cards in this collection yet.
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
          <SortControls value={sortBy} onChange={setSortBy} showRewards={false} />
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
        {filtered.map((player, i) => (
          <div key={`${player.id}-${i}`}>
            <PlayerCard
              player={player}
              onClick={() => setSelectedPlayer(player)}
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && ownedPlayers.length > 0 && (
        <div className="py-12 text-center text-white/40">
          No cards match your filters. Try adjusting your search.
        </div>
      )}

      <PlayerCardModal
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      />
    </div>
  );
}
