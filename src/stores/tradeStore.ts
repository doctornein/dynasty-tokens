"use client";

import { create } from "zustand";
import { Trade, TradeStatus, TradeWishlistEntry } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";

function mapTrade(row: Record<string, unknown>): Trade {
  const receiverId = (row.receiver_id as string) ?? null;
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    senderUsername:
      (row.sender as { username: string } | null)?.username ?? "Unknown",
    receiverId,
    receiverUsername:
      (row.receiver as { username: string } | null)?.username ?? null,
    senderCards: (row.sender_cards as string[]) ?? [],
    receiverCards: (row.receiver_cards as string[]) ?? [],
    senderDt: Number(row.sender_dt) || 0,
    receiverDt: Number(row.receiver_dt) || 0,
    message: (row.message as string) ?? null,
    status: row.status as TradeStatus,
    createdAt: row.created_at as string,
    respondedAt: (row.responded_at as string) ?? null,
    fulfilledBy: (row.fulfilled_by as string) ?? null,
    isOpen: receiverId === null,
  };
}

function mapWishlist(row: Record<string, unknown>): TradeWishlistEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    playerId: row.player_id as string,
    maxCardsGive: (row.max_cards_give as number) ?? null,
    maxDtGive: Number(row.max_dt_give) || 0,
    minDtReceive: Number(row.min_dt_receive) || 0,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
  };
}

interface TradeStore {
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  openTrades: Trade[];
  wishlists: TradeWishlistEntry[];
  loading: boolean;
  fetchTrades: () => Promise<void>;
  fetchOpenTrades: () => Promise<void>;
  createTrade: (
    receiverUsername: string | null,
    senderCards: string[],
    receiverCards: string[],
    senderDt: number,
    receiverDt: number,
    message?: string
  ) => Promise<{ success: boolean; error?: string; autoAccepted?: boolean }>;
  acceptTrade: (tradeId: string) => Promise<{ success: boolean; error?: string }>;
  declineTrade: (tradeId: string) => Promise<{ success: boolean; error?: string }>;
  cancelTrade: (tradeId: string) => Promise<{ success: boolean; error?: string }>;
  fulfillOpenTrade: (tradeId: string) => Promise<{ success: boolean; error?: string }>;
  fetchWishlists: () => Promise<void>;
  upsertWishlist: (
    playerId: string,
    maxCardsGive: number | null,
    maxDtGive: number,
    minDtReceive: number
  ) => Promise<{ success: boolean; error?: string }>;
  removeWishlist: (playerId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useTradeStore = create<TradeStore>()((set, get) => ({
  incomingTrades: [],
  outgoingTrades: [],
  openTrades: [],
  wishlists: [],
  loading: false,

  fetchTrades: async () => {
    const auth = useAuthStore.getState();
    if (!auth.user) return;

    set({ loading: true });
    const supabase = createClient();

    const { data } = await supabase
      .from("trades")
      .select(
        "*, sender:profiles!sender_id(username), receiver:profiles!trades_receiver_id_fkey(username)"
      )
      .or(`sender_id.eq.${auth.user.id},receiver_id.eq.${auth.user.id}`)
      .order("created_at", { ascending: false });

    if (data) {
      const trades = data.map((row) =>
        mapTrade(row as Record<string, unknown>)
      );
      set({
        incomingTrades: trades.filter(
          (t) => t.receiverId === auth.user!.id && !t.isOpen
        ),
        outgoingTrades: trades.filter((t) => t.senderId === auth.user!.id),
      });
    }

    set({ loading: false });
  },

  fetchOpenTrades: async () => {
    const auth = useAuthStore.getState();
    const supabase = createClient();

    const { data } = await supabase
      .from("trades")
      .select(
        "*, sender:profiles!sender_id(username)"
      )
      .is("receiver_id", null)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (data) {
      const trades = data.map((row) =>
        mapTrade(row as Record<string, unknown>)
      );
      // Filter out user's own open offers (those show in Outgoing tab)
      set({
        openTrades: auth.user
          ? trades.filter((t) => t.senderId !== auth.user!.id)
          : trades,
      });
    }
  },

  createTrade: async (
    receiverUsername,
    senderCards,
    receiverCards,
    senderDt,
    receiverDt,
    message
  ) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_trade", {
      p_receiver_username: receiverUsername,
      p_sender_cards: senderCards,
      p_receiver_cards: receiverCards,
      p_sender_dt: senderDt,
      p_receiver_dt: receiverDt,
      p_message: message ?? null,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return { success: false, error: data?.error ?? "Failed to create trade" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchTrades();
    if (receiverUsername === null) {
      await get().fetchOpenTrades();
    }
    return { success: true, autoAccepted: data?.auto_accepted ?? false };
  },

  acceptTrade: async (tradeId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_trade", {
      p_trade_id: tradeId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return { success: false, error: data?.error ?? "Failed to accept trade" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchTrades();
    return { success: true };
  },

  declineTrade: async (tradeId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("decline_trade", {
      p_trade_id: tradeId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return {
        success: false,
        error: data?.error ?? "Failed to decline trade",
      };

    await get().fetchTrades();
    return { success: true };
  },

  cancelTrade: async (tradeId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cancel_trade", {
      p_trade_id: tradeId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return {
        success: false,
        error: data?.error ?? "Failed to cancel trade",
      };

    await useAuthStore.getState().refreshProfile();
    await get().fetchTrades();
    await get().fetchOpenTrades();
    return { success: true };
  },

  fulfillOpenTrade: async (tradeId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("fulfill_open_trade", {
      p_trade_id: tradeId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return {
        success: false,
        error: data?.error ?? "Failed to fulfill trade",
      };

    await useAuthStore.getState().refreshProfile();
    await get().fetchTrades();
    await get().fetchOpenTrades();
    return { success: true };
  },

  fetchWishlists: async () => {
    const auth = useAuthStore.getState();
    if (!auth.user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("trade_wishlists")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      set({
        wishlists: data.map((row) =>
          mapWishlist(row as Record<string, unknown>)
        ),
      });
    }
  },

  upsertWishlist: async (playerId, maxCardsGive, maxDtGive, minDtReceive) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("upsert_trade_wishlist", {
      p_player_id: playerId,
      p_max_cards_give: maxCardsGive,
      p_max_dt_give: maxDtGive,
      p_min_dt_receive: minDtReceive,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return { success: false, error: data?.error ?? "Failed to save wishlist entry" };

    await get().fetchWishlists();
    return { success: true };
  },

  removeWishlist: async (playerId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("remove_trade_wishlist", {
      p_player_id: playerId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success)
      return { success: false, error: data?.error ?? "Failed to remove wishlist entry" };

    await get().fetchWishlists();
    return { success: true };
  },
}));
