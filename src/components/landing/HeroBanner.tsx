"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { ArrowRight, Zap } from "lucide-react";
import { HeroNewsFeed } from "./HeroNewsFeed";

export function HeroBanner() {
  return (
    <section className="relative flex min-h-[80vh] items-stretch overflow-hidden">
      {/* Background image — subject centered behind left-side text */}
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        style={{ objectPosition: "30% center" }}
        sizes="100vw"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Animated aura gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/15 via-transparent to-[#8B5CF6]/15" />
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,215,0,0.12) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(0,212,255,0.12) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(139,92,246,0.12) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(255,215,0,0.12) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />

      {/* Left — hero text */}
      <div className="relative z-10 flex flex-1 items-center px-6 py-20 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-xl text-center md:mx-0 md:text-left"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-4 py-1.5 text-sm text-[#FFD700] backdrop-blur-sm">
            <Zap className="h-4 w-4" />
            Free to Play
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight text-white drop-shadow-lg md:text-7xl">
            Build Your
            <span className="bg-gradient-to-r from-[#FFD700] via-[#00D4FF] to-[#8B5CF6] bg-clip-text text-transparent">
              {" "}Dynasty
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-lg text-lg text-white/70 drop-shadow md:mx-0 md:text-xl">
            Collect legendary NBA player cards. Open packs, discover rare talent,
            earn rewards, and build the ultimate basketball dynasty.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <Link href="/market">
              <GlowButton variant="gold" size="lg">
                <span className="flex items-center gap-2">
                  Open Packs <ArrowRight className="h-5 w-5" />
                </span>
              </GlowButton>
            </Link>
            <Link href="/collection">
              <GlowButton variant="blue" size="lg">
                Locker Room
              </GlowButton>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right — NBA news, docked to right edge */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10 hidden w-[480px] shrink-0 md:block"
      >
        <HeroNewsFeed />
      </motion.div>
    </section>
  );
}
