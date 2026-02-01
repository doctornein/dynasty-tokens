"use client";

import { HeroBanner } from "@/components/landing/HeroBanner";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturedPacks } from "@/components/landing/FeaturedPacks";
import { LiveMarquee } from "@/components/landing/LiveMarquee";
import { RecentPulls } from "@/components/landing/RecentPulls";
import { ArenaHappenings } from "@/components/landing/ArenaHappenings";
import { AuctionUpdates } from "@/components/landing/AuctionUpdates";
import { RecentRewards } from "@/components/landing/RecentRewards";

export default function HomePage() {
  return (
    <div>
      <HeroBanner />
      <LiveMarquee />

      {/* Live Activity — casino floor */}
      <section className="relative overflow-hidden py-12">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#00D4FF]/[0.04] blur-[120px]" />
          <div className="absolute right-1/4 top-20 h-96 w-96 rounded-full bg-[#F97316]/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[#10B981]/[0.04] blur-[120px]" />
          <div className="absolute bottom-10 right-1/3 h-96 w-96 rounded-full bg-[#FFD700]/[0.03] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">
              Live Activity
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RecentPulls />
            <ArenaHappenings />
            <AuctionUpdates />
            <RecentRewards />
          </div>
        </div>
      </section>

      <HowItWorks />
      <FeaturedPacks />
    </div>
  );
}
