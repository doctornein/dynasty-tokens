"use client";

import { useEffect } from "react";
import { CollectionGrid } from "@/components/collection/CollectionGrid";
import { useCollectionStore } from "@/stores/collectionStore";
import { useAuthStore } from "@/stores/authStore";
import { Library } from "lucide-react";

export default function CollectionPage() {
  const { user, isAuthenticated, loading } = useAuthStore();
  const { ownedCards, fetchCards } = useCollectionStore();

  useEffect(() => {
    if (user) {
      fetchCards(user.id);
    }
  }, [user, fetchCards]);

  const authenticated = isAuthenticated();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Library className="h-8 w-8 text-[#00D4FF]" />
        <div>
          <h1 className="text-3xl font-bold text-white">Locker Room</h1>
          <p className="text-sm text-white/40">
            {loading ? "Loading..." : `${ownedCards.length} cards collected`}
          </p>
        </div>
      </div>
      {!loading && authenticated ? <CollectionGrid /> : null}
      {!loading && !authenticated && (
        <div className="py-20 text-center text-white/40">
          Sign in to view your collection.
        </div>
      )}
    </div>
  );
}
