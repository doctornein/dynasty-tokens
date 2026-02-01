"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Transaction } from "@/types";

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  transactions: Transaction[];

  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  isAuthenticated: () => boolean;
  getBalance: () => number;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  transactions: [],

  initialize: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ user: null, profile: null, loading: false, transactions: [] });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    set({ user, profile: profile ?? null, loading: false });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, transactions: [] });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) set({ profile });
  },

  fetchTransactions: async () => {
    const { user } = get();
    if (!user) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: Transaction[] = data.map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: t.amount,
        timestamp: t.created_at,
        packId: t.pack_id ?? undefined,
      }));
      set({ transactions: mapped });
    }
  },

  isAuthenticated: () => !!get().user,

  getBalance: () => get().profile?.balance ?? 0,
}));
