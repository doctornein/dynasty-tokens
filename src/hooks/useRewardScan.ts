"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCollectionStore } from "@/stores/collectionStore";
import { useRewardStore } from "@/stores/rewardStore";
import { useAuthStore } from "@/stores/authStore";
import { players } from "@/data/players";
import type { OwnedPlayerInfo } from "@/lib/airdropDetection";

function extractEspnId(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const match = imageUrl.match(/\/players\/full\/(\d+)/);
  return match ? match[1] : null;
}

export function useRewardScan() {
  const ownedCards = useCollectionStore((s) => s.ownedCards);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { rewards, detect, isScanning, lastScanAt, setScanning, setLastScanAt } = useRewardStore();
  const [error, setError] = useState<string | null>(null);
  const scanningRef = useRef(false);

  const scan = useCallback(async () => {
    if (scanningRef.current) return;
    if (!isAuthenticated || ownedCards.length === 0) return;

    scanningRef.current = true;
    setScanning(true);
    setError(null);

    try {
      const playerMap = new Map<string, OwnedPlayerInfo>();

      for (const card of ownedCards) {
        const player = players.find((p) => p.id === card.playerId);
        if (!player) continue;

        const espnId = extractEspnId(player.image);
        if (!espnId) continue;

        const existing = playerMap.get(player.id);
        if (existing) {
          existing.cards.push({
            instanceId: card.instanceId,
            acquiredAt: card.acquiredAt,
          });
        } else {
          playerMap.set(player.id, {
            playerId: player.id,
            playerName: player.name,
            playerImage: player.image,
            espnId,
            cards: [{ instanceId: card.instanceId, acquiredAt: card.acquiredAt }],
          });
        }
      }

      const playerInfos = Array.from(playerMap.values());
      if (playerInfos.length === 0) {
        setLastScanAt(new Date().toISOString());
        return;
      }

      const existingRewardIds = rewards.map((r) => r.id);

      const res = await fetch("/api/airdrops/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: playerInfos, existingAirdropIds: existingRewardIds }),
      });

      if (!res.ok) {
        throw new Error(`Scan failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.rewards?.length > 0) {
        detect(data.rewards);
      }
      setLastScanAt(data.scannedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
      scanningRef.current = false;
    }
  }, [isAuthenticated, ownedCards, rewards, detect, setScanning, setLastScanAt]);

  // Auto-scan on mount if stale (> 5 min) or never scanned
  useEffect(() => {
    if (!isAuthenticated || ownedCards.length === 0) return;

    const fiveMinutes = 5 * 60 * 1000;
    const shouldScan =
      !lastScanAt || Date.now() - new Date(lastScanAt).getTime() > fiveMinutes;

    if (shouldScan) {
      scan();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    scan,
    isScanning,
    lastScanAt,
    error,
    playerCount: new Set(ownedCards.map((c) => c.playerId)).size,
  };
}
