"use client";

import Link from "next/link";
import { NavLink } from "./NavLink";
import { MobileNav } from "./MobileNav";
import { AuthButton } from "@/components/auth/AuthButton";
import { BalanceDisplay } from "@/components/wallet/BalanceDisplay";
import { RewardChip } from "@/components/rewards/RewardChip";
import { Crown } from "lucide-react";

const navLinks = [
  { href: "/scores", label: "Scores" },
  { href: "/market", label: "Market" },
  { href: "/arena", label: "Arena" },
  { href: "/collection", label: "Locker Room" },
  { href: "/rewards", label: "Rewards" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/transactions", label: "History" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Crown className="h-7 w-7 text-[#FFD700]" />
          <span className="text-lg font-bold text-white">
            Dynasty<span className="text-[#FFD700]">Tokens</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <RewardChip />
          <BalanceDisplay />
          <AuthButton />
        </div>

        <MobileNav links={navLinks} />
      </div>
    </header>
  );
}
