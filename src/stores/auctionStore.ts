"use client";

import { create } from "zustand";
import { Auction, Bid } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";
import { useCollectionStore } from "./collectionStore";

interface AuctionStore {
  auctions: Auction[];
  myListings: Auction[];
  myBids: Auction[];
  loading: boolean;
  fetchAuctions: () => Promise<void>;
  fetchMyListings: () => Promise<void>;
  fetchMyBids: () => Promise<void>;
  fetchBidsForAuction: (auctionId: string) => Promise<Bid[]>;
  createAuction: (
    cardInstanceId: string,
    playerId: string,
    startingBid: number,
    buyNowPrice: number | null,
    durationHours: number
  ) => Promise<{ success: boolean; error?: string }>;
  placeBid: (
    auctionId: string,
    amount: number
  ) => Promise<{ success: boolean; error?: string }>;
  buyNow: (
    auctionId: string
  ) => Promise<{ success: boolean; error?: string }>;
  cancelAuction: (
    auctionId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export const useAuctionStore = create<AuctionStore>()((set, get) => ({
  auctions: [],
  myListings: [],
  myBids: [],
  loading: false,

  fetchAuctions: async () => {
    set({ loading: true });
    const supabase = createClient();

    // Lazy-settle expired auctions client-side
    const { data: expired } = await supabase
      .from("auctions")
      .select("id")
      .eq("status", "active")
      .lte("ends_at", new Date().toISOString());

    if (expired && expired.length > 0) {
      for (const a of expired.slice(0, 10)) {
        await supabase.rpc("settle_auction", { p_auction_id: a.id });
      }
    }

    // Fetch active auctions with seller username
    const { data } = await supabase
      .from("auctions")
      .select("*, seller:profiles!seller_id(username)")
      .eq("status", "active")
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true });

    if (data) {
      const auctions: Auction[] = data.map((a) => ({
        id: a.id,
        sellerId: a.seller_id,
        sellerUsername: (a.seller as { username: string })?.username ?? "Unknown",
        cardInstanceId: a.card_instance_id,
        playerId: a.player_id,
        startingBid: Number(a.starting_bid),
        buyNowPrice: a.buy_now_price ? Number(a.buy_now_price) : null,
        currentBid: a.current_bid ? Number(a.current_bid) : null,
        currentBidderId: a.current_bidder_id,
        bidCount: a.bid_count,
        status: a.status,
        endsAt: a.ends_at,
        createdAt: a.created_at,
      }));
      set({ auctions });
    }

    set({ loading: false });
  },

  fetchMyListings: async () => {
    const auth = useAuthStore.getState();
    if (!auth.user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("auctions")
      .select("*, seller:profiles!seller_id(username)")
      .eq("seller_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const myListings: Auction[] = data.map((a) => ({
        id: a.id,
        sellerId: a.seller_id,
        sellerUsername: (a.seller as { username: string })?.username ?? "Unknown",
        cardInstanceId: a.card_instance_id,
        playerId: a.player_id,
        startingBid: Number(a.starting_bid),
        buyNowPrice: a.buy_now_price ? Number(a.buy_now_price) : null,
        currentBid: a.current_bid ? Number(a.current_bid) : null,
        currentBidderId: a.current_bidder_id,
        bidCount: a.bid_count,
        status: a.status,
        endsAt: a.ends_at,
        createdAt: a.created_at,
      }));
      set({ myListings });
    }
  },

  fetchMyBids: async () => {
    const auth = useAuthStore.getState();
    if (!auth.user) return;

    const supabase = createClient();

    // Get auction IDs where user has bid
    const { data: bidData } = await supabase
      .from("bids")
      .select("auction_id")
      .eq("bidder_id", auth.user.id);

    if (!bidData || bidData.length === 0) {
      set({ myBids: [] });
      return;
    }

    const auctionIds = [...new Set(bidData.map((b) => b.auction_id))];

    const { data } = await supabase
      .from("auctions")
      .select("*, seller:profiles!seller_id(username)")
      .in("id", auctionIds)
      .order("ends_at", { ascending: true });

    if (data) {
      const myBids: Auction[] = data.map((a) => ({
        id: a.id,
        sellerId: a.seller_id,
        sellerUsername: (a.seller as { username: string })?.username ?? "Unknown",
        cardInstanceId: a.card_instance_id,
        playerId: a.player_id,
        startingBid: Number(a.starting_bid),
        buyNowPrice: a.buy_now_price ? Number(a.buy_now_price) : null,
        currentBid: a.current_bid ? Number(a.current_bid) : null,
        currentBidderId: a.current_bidder_id,
        bidCount: a.bid_count,
        status: a.status,
        endsAt: a.ends_at,
        createdAt: a.created_at,
      }));
      set({ myBids });
    }
  },

  fetchBidsForAuction: async (auctionId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("bids")
      .select("*, bidder:profiles!bidder_id(username)")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((b) => ({
      id: b.id,
      auctionId: b.auction_id,
      bidderId: b.bidder_id,
      bidderUsername: (b.bidder as { username: string })?.username ?? "Unknown",
      amount: Number(b.amount),
      createdAt: b.created_at,
    }));
  },

  createAuction: async (cardInstanceId, playerId, startingBid, buyNowPrice, durationHours) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_auction", {
      p_card_instance_id: cardInstanceId,
      p_player_id: playerId,
      p_starting_bid: startingBid,
      p_buy_now_price: buyNowPrice,
      p_duration_hours: durationHours,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to create auction" };

    // Refresh
    const auth = useAuthStore.getState();
    if (auth.user) {
      await useCollectionStore.getState().fetchCards(auth.user.id);
    }
    await get().fetchAuctions();
    await get().fetchMyListings();

    return { success: true };
  },

  placeBid: async (auctionId, amount) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("place_bid", {
      p_auction_id: auctionId,
      p_amount: amount,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to place bid" };

    await useAuthStore.getState().refreshProfile();
    await get().fetchAuctions();

    return { success: true };
  },

  buyNow: async (auctionId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("buy_now", {
      p_auction_id: auctionId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to buy" };

    const auth = useAuthStore.getState();
    await auth.refreshProfile();
    if (auth.user) {
      await useCollectionStore.getState().fetchCards(auth.user.id);
    }
    await get().fetchAuctions();

    return { success: true };
  },

  cancelAuction: async (auctionId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cancel_auction", {
      p_auction_id: auctionId,
    });

    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error ?? "Failed to cancel" };

    await get().fetchAuctions();
    await get().fetchMyListings();

    return { success: true };
  },
}));
