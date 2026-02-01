"use client";

import { useEffect, useState } from "react";
import { Player, ArenaGameType, ArenaStatCategory, ArenaMatchStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Swords, Loader2 } from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";

interface ArenaHistoryMatch {
  id: string;
  gameType: ArenaGameType;
  statCategories: ArenaStatCategory[];
  startDate: string;
  endDate: string;
  wager: number;
  challengerId: string;
  challengerUsername: string;
  opponentId: string | null;
  opponentUsername: string | null;
  status: ArenaMatchStatus;
  challengerCards: string[];
  opponentCards: string[] | null;
  challengerScore: number | null;
  opponentScore: number | null;
  winnerId: string | null;
  createdAt: string;
}

interface ArenaHistoryTabProps {
  player: Player;
}

export function ArenaHistoryTab({ player }: ArenaHistoryTabProps) {
  const [matches, setMatches] = useState<ArenaHistoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    async function fetchArenaHistory() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("arena_matches")
        .select(
          "*, challenger:profiles!challenger_id(username), opponent:profiles!opponent_id(username)"
        )
        .or(
          `challenger_cards.cs.{${player.id}},opponent_cards.cs.{${player.id}}`
        )
        .order("created_at", { ascending: false });

      if (data) {
        setMatches(
          data.map((row) => ({
            id: row.id,
            gameType: row.game_type,
            statCategories: row.stat_categories,
            startDate: row.start_date,
            endDate: row.end_date,
            wager: Number(row.wager),
            challengerId: row.challenger_id,
            challengerUsername:
              (row.challenger as { username: string } | null)?.username ??
              "Unknown",
            opponentId: row.opponent_id ?? null,
            opponentUsername:
              (row.opponent as { username: string } | null)?.username ?? null,
            status: row.status,
            challengerCards: row.challenger_cards,
            opponentCards: row.opponent_cards ?? null,
            challengerScore:
              row.challenger_score != null
                ? Number(row.challenger_score)
                : null,
            opponentScore:
              row.opponent_score != null ? Number(row.opponent_score) : null,
            winnerId: row.winner_id ?? null,
            createdAt: row.created_at,
          }))
        );
      }

      setLoading(false);
    }

    fetchArenaHistory();
  }, [player.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Swords className="h-8 w-8 text-white/20" />
        <p className="text-sm text-white/40">
          No arena matches featuring this player
        </p>
      </div>
    );
  }

  // Compute summary
  const settled = matches.filter((m) => m.status === "settled");
  const wins = settled.filter((m) => {
    if (!userId) return false;
    return m.winnerId === userId;
  }).length;
  const losses = settled.filter((m) => {
    if (!userId) return false;
    return m.winnerId !== null && m.winnerId !== userId;
  }).length;
  const ties = settled.filter((m) => m.winnerId === null).length;
  const totalWagered = matches.reduce((sum, m) => sum + m.wager, 0);
  const netDt = settled.reduce((sum, m) => {
    if (!userId) return sum;
    if (m.winnerId === userId) return sum + m.wager;
    if (m.winnerId !== null && m.winnerId !== userId) return sum - m.wager;
    return sum;
  }, 0);

  function getResult(match: ArenaHistoryMatch): {
    label: string;
    color: string;
  } {
    if (match.status === "open" || match.status === "matched") {
      return { label: "Pending", color: "text-white/40" };
    }
    if (match.status === "voided" || match.status === "cancelled") {
      return { label: match.status === "voided" ? "Voided" : "Cancelled", color: "text-white/40" };
    }
    if (match.winnerId === null) {
      return { label: "Tie", color: "text-yellow-400" };
    }
    if (userId && match.winnerId === userId) {
      return { label: "Win", color: "text-green-400" };
    }
    return { label: "Loss", color: "text-red-400" };
  }

  function getOpponentName(match: ArenaHistoryMatch): string {
    if (!userId) return match.opponentUsername ?? "Open";
    if (match.challengerId === userId) {
      return match.opponentUsername ?? "Open";
    }
    return match.challengerUsername;
  }

  function getScore(match: ArenaHistoryMatch): string {
    if (match.challengerScore === null || match.opponentScore === null)
      return "-";
    if (!userId) return `${match.challengerScore} - ${match.opponentScore}`;
    if (match.challengerId === userId) {
      return `${match.challengerScore} - ${match.opponentScore}`;
    }
    return `${match.opponentScore} - ${match.challengerScore}`;
  }

  return (
    <div className="space-y-3 p-4">
      {/* Summary */}
      {userId && (
        <div className="flex flex-wrap gap-3 rounded-xl bg-white/5 p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{matches.length}</div>
            <div className="text-[10px] text-white/40">Matches</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {wins}-{losses}-{ties}
            </div>
            <div className="text-[10px] text-white/40">W-L-T</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {formatTokenAmount(totalWagered)}
            </div>
            <div className="text-[10px] text-white/40">Total Wagered</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${netDt > 0 ? "text-green-400" : netDt < 0 ? "text-red-400" : "text-white"}`}
            >
              {netDt > 0 ? "+" : ""}
              {formatTokenAmount(netDt)}
            </div>
            <div className="text-[10px] text-white/40">Net</div>
          </div>
        </div>
      )}

      {/* Match list */}
      <div className="space-y-2">
        {matches.map((match) => {
          const result = getResult(match);
          return (
            <div
              key={match.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
                    {match.gameType}
                  </span>
                  <span className="truncate text-sm font-medium text-white">
                    vs {getOpponentName(match)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {match.statCategories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/50"
                    >
                      {cat}
                    </span>
                  ))}
                  <span className="text-[10px] text-white/30">
                    {formatTokenAmount(match.wager)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-bold ${result.color}`}>
                  {result.label}
                </div>
                <div className="text-[10px] text-white/30">
                  {getScore(match)}
                </div>
                <div className="text-[10px] text-white/20">
                  {new Date(match.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
