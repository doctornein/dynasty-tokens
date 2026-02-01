import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Trophy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Dynasty Tokens",
  description: "See who's building the biggest dynasty. Compare card collections, packs opened, and more.",
};

export const revalidate = 60; // revalidate every 60 seconds

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, balance, packs_opened, created_at, owned_cards(count)")
    .order("packs_opened", { ascending: false });

  const entries = (profiles ?? []).map((p) => ({
    id: p.id as string,
    username: p.username as string,
    display_name: p.display_name as string | null,
    avatar_url: p.avatar_url as string | null,
    balance: p.balance as number,
    packs_opened: p.packs_opened as number,
    created_at: p.created_at as string,
    card_count: (p.owned_cards as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-[#FFD700]" />
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-white/40">
            {entries.length} {entries.length === 1 ? "player" : "players"} building dynasties
          </p>
        </div>
      </div>
      <LeaderboardTable entries={entries} />
    </div>
  );
}
