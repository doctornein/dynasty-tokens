"use client";

import useSWR from "swr";
import Image from "next/image";
import { Newspaper } from "lucide-react";

interface Article {
  headline: string;
  description: string;
  url: string;
  image: string | null;
  published: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 animate-pulse py-3">
      <div className="h-14 w-20 shrink-0 rounded bg-white/5" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function HeroNewsFeed() {
  const { data, isLoading } = useSWR<{ articles: Article[] }>(
    "/api/news/nba",
    fetcher,
    { revalidateOnFocus: false }
  );

  const articles = data?.articles ?? [];

  return (
    <div className="flex h-full flex-col border-l border-white/10 bg-black/50 backdrop-blur-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-6 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EF4444]/10">
          <Newspaper className="h-4 w-4 text-[#EF4444]" />
        </div>
        <h3 className="text-sm font-bold text-white">NBA News</h3>
        <div className="ml-auto rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#EF4444]">
          ESPN
        </div>
      </div>

      {/* Articles */}
      <div
        className="flex-1 divide-y divide-white/5 overflow-y-auto px-6 py-2"
        style={{
          maskImage: "linear-gradient(to bottom, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black 92%, transparent)",
        }}
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 py-3 transition-colors"
              >
                {article.image && (
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded">
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium leading-snug text-white/90 line-clamp-2 transition-colors group-hover:text-[#EF4444]">
                    {article.headline}
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/35 line-clamp-1">
                    {article.description}
                  </p>
                  <span className="mt-0.5 block text-[10px] text-white/25">
                    {relativeTime(article.published)}
                  </span>
                </div>
              </a>
            ))}
      </div>
    </div>
  );
}
