import { NextResponse } from "next/server";
import { fetchEspnGameLog } from "@/lib/espnGameLog";
import { processPlayerGames, type OwnedPlayerInfo } from "@/lib/airdropDetection";
import type { PerformanceReward } from "@/types";

interface ScanRequest {
  players: OwnedPlayerInfo[];
  existingAirdropIds: string[];
}

export async function POST(request: Request) {
  try {
    const body: ScanRequest = await request.json();
    const { players, existingAirdropIds } = body;

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ rewards: [], scannedAt: new Date().toISOString() });
    }

    const existingIds = new Set(existingAirdropIds ?? []);
    const allNewRewards: PerformanceReward[] = [];

    // Batch fetch ESPN game logs — max 10 concurrent
    const batchSize = 10;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (player) => {
          const games = await fetchEspnGameLog(player.espnId);
          return processPlayerGames(player, games, existingIds);
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allNewRewards.push(...result.value);
        }
      }
    }

    return NextResponse.json({
      rewards: allNewRewards,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Reward scan error:", err);
    return NextResponse.json(
      { error: "Scan failed" },
      { status: 500 }
    );
  }
}
