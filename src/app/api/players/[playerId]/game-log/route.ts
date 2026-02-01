import { NextResponse } from "next/server";
import { fetchEspnGameLog } from "@/lib/espnGameLog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const entries = await fetchEspnGameLog(playerId);

    return NextResponse.json(entries.slice(0, 15), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("Game log fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch game log" },
      { status: 502 }
    );
  }
}
