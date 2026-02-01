"use client";

import { useEffect, useState } from "react";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { ArenaMatch } from "@/types";
import { ArenaChallengeGrid } from "./ArenaChallengeGrid";
import { MyArenaActivity } from "./MyArenaActivity";
import { CreateMatchModal } from "./CreateMatchModal";
import { AcceptMatchModal } from "./AcceptMatchModal";
import { MatchDetailModal } from "./MatchDetailModal";
import { GlowButton } from "@/components/ui/GlowButton";
import { Swords, LayoutList } from "lucide-react";

export function ArenaBoard() {
  const { matches, loading, fetchMatches, fetchMyMatches } = useArenaStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const fetchCards = useCollectionStore((s) => s.fetchCards);

  const [showCreate, setShowCreate] = useState(false);
  const [showMyActivity, setShowMyActivity] = useState(false);
  const [acceptMatch, setAcceptMatch] = useState<ArenaMatch | null>(null);
  const [detailMatch, setDetailMatch] = useState<ArenaMatch | null>(null);

  useEffect(() => {
    fetchMatches();
    if (isAuthenticated) {
      fetchMyMatches();
      if (user) fetchCards(user.id);
    }
  }, [fetchMatches, fetchMyMatches, fetchCards, isAuthenticated, user]);

  const handleSelectMatch = (match: ArenaMatch) => {
    if (match.status === "open" && match.challengerId !== user?.id) {
      setAcceptMatch(match);
    } else {
      setDetailMatch(match);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Swords className="h-8 w-8 text-[#F97316]" />
          <div>
            <h2 className="text-3xl font-bold text-white">Arena</h2>
            <p className="text-sm text-white/40">
              Pit your player cards against others in stat-based fantasy matchups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <button
                onClick={() => setShowMyActivity(!showMyActivity)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  showMyActivity
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-white/40 hover:bg-white/5 hover:text-white/60"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                My Matches
              </button>
              <GlowButton
                variant="orange"
                size="sm"
                onClick={() => setShowCreate(true)}
              >
                <span className="flex items-center gap-2">
                  <Swords className="h-4 w-4" />
                  Create Challenge
                </span>
              </GlowButton>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {showMyActivity ? (
        <MyArenaActivity onSelectMatch={handleSelectMatch} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : (
        <ArenaChallengeGrid
          matches={matches}
          onSelectMatch={handleSelectMatch}
        />
      )}

      {/* Modals */}
      <CreateMatchModal
        open={showCreate}
        onOpenChange={setShowCreate}
      />

      <AcceptMatchModal
        match={acceptMatch}
        open={!!acceptMatch}
        onOpenChange={(open) => !open && setAcceptMatch(null)}
      />

      <MatchDetailModal
        match={detailMatch}
        open={!!detailMatch}
        onOpenChange={(open) => !open && setDetailMatch(null)}
      />
    </div>
  );
}
