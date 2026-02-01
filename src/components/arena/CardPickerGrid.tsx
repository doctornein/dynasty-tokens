"use client";

import { useMemo, useState } from "react";
import { useCollectionStore } from "@/stores/collectionStore";
import { players } from "@/data/players";
import { Player } from "@/types";
import { PlayerCard } from "@/components/collection/PlayerCard";
import { Search, Check } from "lucide-react";
import { resolveLegacyId } from "@/data/legacy-id-map";

interface CardPickerGridProps {
  maxSelection: number;
  selected: string[];
  onSelectionChange: (playerIds: string[]) => void;
}

export function CardPickerGrid({ maxSelection, selected, onSelectionChange }: CardPickerGridProps) {
  const ownedCards = useCollectionStore((s) => s.ownedCards);
  const [search, setSearch] = useState("");

  // Get unique owned players
  const ownedPlayers = useMemo(() => {
    const seen = new Set<string>();
    const result: Player[] = [];
    for (const card of ownedCards) {
      const resolvedId = resolveLegacyId(card.playerId);
      if (seen.has(resolvedId)) continue;
      seen.add(resolvedId);
      const player = players.find((p) => p.id === resolvedId || p.id === card.playerId);
      if (player) result.push(player);
    }
    return result;
  }, [ownedCards]);

  const filtered = useMemo(() => {
    if (!search) return ownedPlayers;
    const q = search.toLowerCase();
    return ownedPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamAbbr.toLowerCase().includes(q)
    );
  }, [ownedPlayers, search]);

  const togglePlayer = (playerId: string) => {
    if (selected.includes(playerId)) {
      onSelectionChange(selected.filter((id) => id !== playerId));
    } else if (selected.length < maxSelection) {
      onSelectionChange([...selected, playerId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {selected.length} / {maxSelection} selected
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your cards..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
        />
      </div>

      {ownedPlayers.length === 0 && (
        <div className="py-8 text-center text-sm text-white/40">
          No cards in your collection
        </div>
      )}

      <div className="grid max-h-[40vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
        {filtered.map((player) => {
          const isSelected = selected.includes(player.id);
          return (
            <div
              key={player.id}
              className="relative"
              onClick={() => togglePlayer(player.id)}
            >
              <div
                className={`rounded-2xl transition-all ${
                  isSelected
                    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#12121a]"
                    : selected.length >= maxSelection
                      ? "opacity-40"
                      : ""
                }`}
              >
                <PlayerCard player={player} compact />
              </div>
              {isSelected && (
                <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
