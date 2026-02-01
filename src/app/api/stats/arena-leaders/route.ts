import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300; // 5-minute cache

export async function GET() {
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("arena_matches")
    .select("winner_id, challenger_id, challenger_cards, opponent_cards")
    .eq("status", "settled")
    .not("winner_id", "is", null);

  if (error) {
    return NextResponse.json({ leaders: [] }, { status: 500 });
  }

  // Count wins per player_id from winning cards
  const winsMap = new Map<string, number>();

  for (const match of matches) {
    const winningCards: string[] =
      match.winner_id === match.challenger_id
        ? match.challenger_cards
        : match.opponent_cards;

    if (!Array.isArray(winningCards)) continue;

    for (const playerId of winningCards) {
      winsMap.set(playerId, (winsMap.get(playerId) || 0) + 1);
    }
  }

  // Sort by wins descending, take top 10
  const leaders = Array.from(winsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([playerId, wins]) => ({ playerId, wins }));

  return NextResponse.json({ leaders });
}
