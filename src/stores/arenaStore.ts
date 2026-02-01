"use client";

import { create } from "zustand";
import { ArenaMatch, ArenaGameType, ArenaStatCategory } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";

function mapMatch(row: Record<string, unknown>): ArenaMatch {
  return {
    id: row.id as string,
    gameType: row.game_type as ArenaGameType,
    statCategories: row.stat_categories as ArenaStatCategory[],
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    wager: Number(row.wager),
    challengerId: row.challenger_id as string,
    challengerUsername:
      (row.challenger as { username: string } | null)?.username ?? "Unknown",
    opponentId: (row.opponent_id as string) ?? null,
    opponentUsername:
      (row.opponent as { username: string } | null)?.username ?? null,
    invitedUsername: (row.invited_username as string) ?? null,
    status: row.status as ArenaMatch["status"],
    challengerCards: row.challenger_cards as string[],
    opponentCards: (row.opponent_cards as string[]) ?? null,
    challengerScore: row.challenger_score != null ? Number(row.challenger_score) : null,
    opponentScore: row.opponent_score != null ? Number(row.opponent_score) : null,
    winnerId: (row.winner_id as string) ?? null,
    createdAt: row.created_at as string,
    acceptedAt: (row.accepted_at as string) ?? null,
    settledAt: (row.settled_at as string) ?? null,
  };
}

interface ArenaStore {
  matches: ArenaMatch[];
  myMatches: ArenaMatch[];
  loading: boolean;
  fetchMatches: () => Promise<void>;
  fetchMyMatches: () => Promise<void>;
  createMatch: (
    gameType: ArenaGameType,
    statCategories: ArenaStatCategory[],
    startDate: string,
    endDate: string,
    wager: number,
    cards: string[],
    invitedUsername?: string
  ) => Promise<{ success: boolean; error?: string }>;
  acceptMatch: (
    matchId: string,
    cards: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  cancelMatch: (
    matchId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const useArenaStore = create<ArenaStore>()((set, get) => ({
  matches: [],
  myMatches: [],
  loading: false,

  fetchMatches: async () => {
    set({ loading: true });
    const supabase = createClient();

    // Lazy-expire unmatched past-date challenges
    const { data: expired } = await supabase
      .from("arena_matches")
      .select("id")
      .eq("status", "open")
      .lt("end_date", new Date().toISOString().split("T")[0]);

    if (expired && expired.length > 0) {
      await supabase.rpc("expire_unmatched_arena");
    }

    // Fetch open matches with challenger profile
    const { data } = await supabase
      .from("arena_matches")
      .select("*, challenger:profiles!challenger_id(username), opponent:profiles!opponent_id(username)")
      .eq("status", "open")
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("created_at", { ascending: false });

    if (data) {
      set({ matches: data.map((row) => mapMatch(row as Record<string, unknown>)) });
    }

    set({ loading: false });
  },

  fetchMyMatches: async () => {
    const auth = useAuthStore.getState();
    if (!auth.user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("arena_matches")
      .select("*, challenger:profiles!challenger_id(username), opponent:profiles!opponent_id(username)")
      .or(`challenger_id.eq.${auth.user.id},opponent_id.eq.${auth.user.id}`)
      .order("created_at", { ascending: false });

    if (data) {
      set({ myMatches: data.map((row) => mapMatch(row as Record<string, unknown>)) });
    }
  },

  createMatch: async (gameType, statCategories, startDate, endDate, wager, cards, invitedUsername) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_arena_match", {
      p_game_type: gameType,
      p_stat_categories: statCategories,
      p_start_date: startDate,
      p_end_date: endDate,
      p_wager: wager,
      p_cards: cards,
      p_invited_username: invitedUsername ?? null,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to create match" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchMatches();
    await get().fetchMyMatches();

    return { success: true };
  },

  acceptMatch: async (matchId, cards) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_arena_match", {
      p_match_id: matchId,
      p_cards: cards,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to accept match" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchMatches();
    await get().fetchMyMatches();

    return { success: true };
  },

  cancelMatch: async (matchId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cancel_arena_match", {
      p_match_id: matchId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to cancel match" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchMatches();
    await get().fetchMyMatches();

    return { success: true };
  },
}));
