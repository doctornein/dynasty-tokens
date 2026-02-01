import { NextResponse } from "next/server";

export interface EspnBioResponse {
  height: string;
  weight: string;
  experience: string;
  draft: string;
  birthPlace: string;
  college: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${playerId}`,
      { next: { revalidate: 86400 } } // cache 24hr — bio data rarely changes
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "ESPN API returned " + res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const a = data.athlete;

    if (!a) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    const bio: EspnBioResponse = {
      height: a.displayHeight ?? "",
      weight: a.displayWeight ?? "",
      experience: a.displayExperience ?? "",
      draft: a.displayDraft ?? "Undrafted",
      birthPlace: a.displayBirthPlace ?? "",
      college: a.college?.name ?? null,
    };

    return NextResponse.json(bio, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
      },
    });
  } catch (err) {
    console.error("Bio fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bio" },
      { status: 502 }
    );
  }
}
