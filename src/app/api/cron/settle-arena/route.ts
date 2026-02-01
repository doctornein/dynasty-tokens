import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  // 1. Settle matched arena matches
  const settleRes = await fetch(`${baseUrl}/api/arena/settle`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const settleData = settleRes.ok ? await settleRes.json() : { error: "settle failed" };

  // 2. Expire unmatched challenges
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: expireData, error: expireError } = await supabase.rpc("expire_unmatched_arena");

  return NextResponse.json({
    success: true,
    settlement: settleData,
    expiration: expireError ? { error: expireError.message } : expireData,
  });
}
