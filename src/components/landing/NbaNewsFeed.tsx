"use client";

import useSWR from "swr";
import Image from "next/image";
import { motion } from "framer-motion";
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

function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-xl bg-white/[0.03] p-3 animate-pulse">
      <div className="h-20 w-28 shrink-0 rounded-lg bg-white/5" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3.5 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-2.5 w-16 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function NbaNewsFeed() {
  const { data, isLoading } = useSWR<{ articles: Article[] }>(
    "/api/news/nba",
    fetcher,
    { revalidateOnFocus: false }
  );

  const articles = data?.articles ?? [];

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EF4444]/10">
          <Newspaper className="h-4 w-4 text-[#EF4444]" />
        </div>
        <h2 className="text-lg font-bold text-white">NBA News</h2>
        <div className="ml-2 rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#EF4444]">
          ESPN
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((article, i) => (
              <motion.a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-[#EF4444]/20 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(239,68,68,0.06)]"
              >
                {article.image && (
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={article.image}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="112px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium leading-snug text-white line-clamp-2 group-hover:text-[#EF4444] transition-colors">
                    {article.headline}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/40 line-clamp-2">
                    {article.description}
                  </p>
                  <span className="mt-1.5 block text-[10px] text-white/20">
                    {relativeTime(article.published)}
                  </span>
                </div>
              </motion.a>
            ))}
      </div>
    </section>
  );
}
