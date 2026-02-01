"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { LogOut, User } from "lucide-react";

export function AuthButton() {
  const { profile, loading, signOut, isAuthenticated } = useAuthStore();

  if (loading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-xl bg-white/10" />
    );
  }

  if (isAuthenticated() && profile) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/u/${profile.username}`}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 transition-colors hover:border-[#FFD700]/50"
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-white/50" />
          )}
        </Link>
        <button
          onClick={() => signOut()}
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-red-400"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/signup"
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-4 py-2 text-sm font-bold text-black transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20"
    >
      Sign Up
    </Link>
  );
}
