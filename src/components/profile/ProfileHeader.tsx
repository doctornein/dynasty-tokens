"use client";

import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { User, Calendar, CreditCard, Package, Settings } from "lucide-react";
import { GlowButton } from "@/components/ui/GlowButton";

interface ProfileHeaderProps {
  profile: Profile;
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-white/50 transition-colors hover:text-[#FFD700]"
    >
      {label}
    </a>
  );
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.id === profile.id;

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const socials: { href: string; label: string }[] = [];
  if (profile.social_twitter) {
    socials.push({ href: `https://x.com/${profile.social_twitter}`, label: `@${profile.social_twitter}` });
  }
  if (profile.social_instagram) {
    socials.push({ href: `https://instagram.com/${profile.social_instagram}`, label: profile.social_instagram });
  }
  if (profile.social_youtube) {
    socials.push({ href: `https://youtube.com/@${profile.social_youtube}`, label: profile.social_youtube });
  }

  return (
    <div className="relative">
      {/* Header image or gradient */}
      <div className="h-48 w-full sm:h-56">
        {profile.header_url ? (
          <Image
            src={profile.header_url}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-600/40 via-[#0a0a0f] to-red-600/40" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
      </div>

      {/* Profile info */}
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <div className="-mt-20 flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0a0a0f] bg-[#12121a] sm:-mt-24 sm:h-40 sm:w-40">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                width={160}
                height={160}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-white/20" />
            )}
          </div>

          {/* Name / username / bio */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {profile.display_name ?? profile.username}
              </h1>
              {isOwner && (
                <Link href="/settings/profile">
                  <GlowButton variant="blue" size="sm">
                    <span className="flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Edit Profile
                    </span>
                  </GlowButton>
                </Link>
              )}
            </div>
            <p className="text-sm text-white/40">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm text-white/60">{profile.bio}</p>
            )}

            {socials.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {socials.map((s, i) => (
                  <SocialLink key={i} href={s.href} label={s.label} />
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {profile.packs_opened} packs opened
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Collection
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {joinDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
