import { NextResponse } from "next/server";

interface ESPNArticle {
  headline: string;
  description: string;
  links: { web: { href: string } };
  images?: { url: string }[];
  published: string;
}

interface ESPNResponse {
  articles: ESPNArticle[];
}

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news",
      { next: { revalidate: 900 } }
    );

    if (!res.ok) {
      return NextResponse.json({ articles: [] }, { status: 200 });
    }

    const data: ESPNResponse = await res.json();

    const articles = (data.articles ?? []).slice(0, 20).map((a) => ({
      headline: a.headline,
      description: a.description,
      url: a.links?.web?.href ?? "#",
      image: a.images?.[0]?.url ?? null,
      published: a.published,
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] }, { status: 200 });
  }
}
