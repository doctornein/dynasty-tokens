"use client";

import { create } from "zustand";
import { OwnedCard, Player } from "@/types";
import { players } from "@/data/players";
import { resolveLegacyId } from "@/data/legacy-id-map";
import { createClient } from "@/lib/supabase/client";

interface CollectionStore {
  ownedCards: OwnedCard[];
  fetchCards: (userId: string) => Promise<void>;
  fetchCardsByUsername: (username: string) => Promise<OwnedCard[]>;
}

export const useCollectionStore = create<CollectionStore>()((set) => ({
  ownedCards: [],

  fetchCards: async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("owned_cards")
      .select("*")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false });

    if (data) {
      const cards: OwnedCard[] = data.map((c) => ({
        instanceId: c.instance_id,
        playerId: c.player_id,
        acquiredAt: c.acquired_at,
        packId: c.pack_id,
      }));
      set({ ownedCards: cards });
    }
  },

  fetchCardsByUsername: async (username: string) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .single();

    if (!profile) return [];

    const { data } = await supabase
      .from("owned_cards")
      .select("*")
      .eq("user_id", profile.id)
      .order("acquired_at", { ascending: false });

    if (!data) return [];

    return data.map((c) => ({
      instanceId: c.instance_id,
      playerId: c.player_id,
      acquiredAt: c.acquired_at,
      packId: c.pack_id,
    }));
  },
}));

// Derived helpers that read from getState() — use outside of selectors
export function getOwnedPlayers(ownedCards: OwnedCard[]): Player[] {
  return ownedCards
    .map((card) => {
      const resolvedId = resolveLegacyId(card.playerId);
      return players.find((p) => p.id === resolvedId || p.id === card.playerId);
    })
    .filter((p): p is Player => p !== undefined);
}

export function getUniquePlayerIds(ownedCards: OwnedCard[]): string[] {
  return [...new Set(ownedCards.map((c) => resolveLegacyId(c.playerId)))];
}
