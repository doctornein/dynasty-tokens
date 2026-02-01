"use client";

import { create } from "zustand";
import { Pack, Player } from "@/types";
import { packs } from "@/data/packs";
import { openPack } from "@/lib/packEngine";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";
import { useCollectionStore } from "./collectionStore";

interface MarketStore {
  packs: Pack[];
  lastOpenedCards: Player[] | null;
  lastOpenedPackId: string | null;
  purchasePack: (packId: string) => Promise<{ success: boolean; players?: Player[]; error?: string }>;
  getPack: (packId: string) => Pack | undefined;
  clearLastOpened: () => void;
  pityCounter: number;
}

export const useMarketStore = create<MarketStore>()((set, get) => ({
  packs: [...packs],
  lastOpenedCards: null,
  lastOpenedPackId: null,
  pityCounter: 0,

  clearLastOpened: () => set({ lastOpenedCards: null, lastOpenedPackId: null }),

  purchasePack: async (packId: string) => {
    const pack = get().packs.find((p) => p.id === packId);
    if (!pack) return { success: false, error: "Pack not found" };
    if (pack.remaining <= 0) return { success: false, error: "Pack sold out" };

    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated()) return { success: false, error: "Not authenticated" };
    if ((auth.profile?.balance ?? 0) < pack.price) return { success: false, error: "Insufficient balance" };

    // Open pack (client-side randomization for card selection)
    const { players: pulledPlayers, newPityCounter } = openPack(pack, get().pityCounter);

    // Build cards payload for the RPC
    const cards = pulledPlayers.map((p) => ({
      instance_id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      player_id: p.id,
    }));

    const supabase = createClient();
    const { data, error } = await supabase.rpc("purchase_pack", {
      p_pack_id: packId,
      p_pack_name: pack.name,
      p_price: pack.price,
      p_cards: cards,
    });

    if (error || !data?.success) {
      return { success: false, error: data?.error ?? error?.message ?? "Purchase failed" };
    }

    // Sync client state
    await auth.refreshProfile();
    if (auth.user) {
      await useCollectionStore.getState().fetchCards(auth.user.id);
    }

    // Update pack supply and store opened cards
    set({
      pityCounter: newPityCounter,
      lastOpenedCards: pulledPlayers,
      lastOpenedPackId: packId,
      packs: get().packs.map((p) =>
        p.id === packId ? { ...p, remaining: p.remaining - 1 } : p
      ),
    });

    return { success: true, players: pulledPlayers };
  },

  getPack: (packId: string) => get().packs.find((p) => p.id === packId),
}));
