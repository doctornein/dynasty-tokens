import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { fetchEspnGameLog } from "@/lib/espnGameLog";
import { fetchTeamGameDates } from "@/lib/espnSchedule";
import { calculateScore, detectDNP } from "@/lib/arenaScoring";
import { players } from "@/data/players";
import type { ArenaStatCategory } from "@/types";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch matches ready for settlement
  const { data: matches, error: fetchError } = await supabase
    .from("arena_matches")
    .select("*")
    .eq("status", "matched")
    .lt("end_date", new Date().toISOString().split("T")[0])
    .limit(20);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!matches || matches.length === 0) {
    return NextResponse.json({ settled_count: 0, voided_count: 0 });
  }

  let settledCount = 0;
  let voidedCount = 0;

  for (const match of matches) {
    try {
      const statCategories = match.stat_categories as ArenaStatCategory[];
      const startDate = match.start_date as string;
      const endDate = match.end_date as string;
      const challengerCards = match.challenger_cards as string[];
      const opponentCards = match.opponent_cards as string[];

      let voided = false;
      let challengerTotal = 0;
      let opponentTotal = 0;

      // Process each player in both lineups
      const allPlayerIds = [...challengerCards, ...opponentCards];
      const playerMap = new Map(players.map((p) => [p.id, p]));

      for (const playerId of allPlayerIds) {
        const player = playerMap.get(playerId);
        if (!player) {
          voided = true;
          break;
        }

        const espnId = String(player.id);

        // Fetch game log and team schedule
        const [gameLogs, teamDates] = await Promise.all([
          fetchEspnGameLog(espnId).catch(() => []),
          fetchTeamGameDates(player.teamAbbr).catch(() => []),
        ]);

        // DNP check: team played but player absent
        const teamGameDateStrings = teamDates
          .filter((d) => d.status === "Final")
          .map((d) => d.date);
        const playerGameDates = gameLogs.map((g) => {
          const d = new Date(g.date);
          return d.toISOString().split("T")[0];
        });

        if (detectDNP(teamGameDateStrings, playerGameDates, startDate, endDate)) {
          voided = true;
          break;
        }

        // Calculate score for this player
        const normalizedLogs = gameLogs.map((g) => ({
          ...g,
          date: new Date(g.date).toISOString().split("T")[0],
        }));
        const score = calculateScore(normalizedLogs, startDate, endDate, statCategories);

        if (challengerCards.includes(playerId)) {
          challengerTotal += score;
        } else {
          opponentTotal += score;
        }
      }

      // Settle the match
      const { error: settleError } = await supabase.rpc("settle_arena_match", {
        p_match_id: match.id,
        p_challenger_score: challengerTotal,
        p_opponent_score: opponentTotal,
        p_voided: voided,
      });

      if (settleError) {
        console.error(`Failed to settle ${match.id}:`, settleError.message);
        continue;
      }

      if (voided) {
        voidedCount++;
      } else {
        settledCount++;
      }
    } catch (err) {
      console.error(`Error settling match ${match.id}:`, err);
    }
  }

  return NextResponse.json({ settled_count: settledCount, voided_count: voidedCount });
}
