import { NextRequest, NextResponse } from "next/server";
import { fetchEspnGameLog } from "@/lib/espnGameLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const full = request.nextUrl.searchParams.get("full") === "true";

  try {
    const entries = await fetchEspnGameLog(playerId);

    return NextResponse.json(full ? entries : entries.slice(0, 15), {
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
