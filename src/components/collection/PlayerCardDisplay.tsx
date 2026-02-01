"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Player } from "@/types";
import { CARD_COLORS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { User } from "lucide-react";
import { usePlayerBio } from "@/hooks/usePlayerDetails";

function HeadshotImage({
  fallbackClassName,
  ...props
}: ImageProps & { fallbackClassName?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <User
          className={cn("text-white/10", fallbackClassName)}
          strokeWidth={1}
        />
      </div>
    );
  }
  return <Image {...props} onError={() => setError(true)} />;
}

interface PlayerCardDisplayProps {
  player: Player;
}

export function PlayerCardDisplay({ player }: PlayerCardDisplayProps) {
  const { data: bio, isLoading: bioLoading } = usePlayerBio(player.image);

  const statEntries: {
    label: string;
    key: keyof typeof player.stats;
    suffix?: string;
  }[] = [
    { label: "Points", key: "ppg" },
    { label: "Rebounds", key: "rpg" },
    { label: "Assists", key: "apg" },
    { label: "Steals", key: "spg" },
    { label: "Blocks", key: "bpg" },
    { label: "FG%", key: "fgPct", suffix: "%" },
    { label: "3P%", key: "fg3Pct", suffix: "%" },
    { label: "FT%", key: "ftPct", suffix: "%" },
    { label: "Minutes", key: "mpg" },
  ];

  return (
    <div className="flex flex-col">
      {/* Headshot header */}
      <div
        className="relative -mx-6 -mt-6 mb-4 h-56 overflow-hidden rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none"
        style={{
          background: `linear-gradient(135deg, ${CARD_COLORS.blue}15, ${CARD_COLORS.red}05)`,
        }}
      >
        {player.image ? (
          <HeadshotImage
            src={player.image}
            alt={player.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 95vw, 320px"
            fallbackClassName="h-28 w-28"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-28 w-28 text-white/10" strokeWidth={1} />
          </div>
        )}

        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{
            background: "linear-gradient(to top, #12121a, transparent)",
          }}
        />

        {/* Position badge */}
        <div
          className="absolute left-6 top-6 rounded-md px-2.5 py-1 text-xs font-bold backdrop-blur-sm"
          style={{
            color: CARD_COLORS.blue,
            backgroundColor: `${CARD_COLORS.blue}25`,
            border: `1px solid ${CARD_COLORS.blue}30`,
          }}
        >
          {player.position}
        </div>

        {/* Jersey number */}
        <div className="absolute right-6 top-6 text-3xl font-black text-white/10">
          #{player.jerseyNumber}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{player.name}</h2>
        <p className="mb-3 text-sm text-white/50">{player.team}</p>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {statEntries.map(({ label, key, suffix }) => (
            <div key={key} className="rounded-xl bg-white/5 px-2 py-2">
              <div
                className="text-lg font-black"
                style={{ color: CARD_COLORS.blue }}
              >
                {player.stats[key].toFixed(1)}
                {suffix}
              </div>
              <div className="text-[10px] uppercase text-white/40">{label}</div>
            </div>
          ))}
        </div>

        {/* Bio section — fetched from ESPN */}
        {bioLoading && (
          <div className="mt-4 space-y-1.5">
            <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          </div>
        )}
        {bio && (
          <div className="mt-4 text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-white/5 px-3 py-3">
              {bio.height && (
                <BioRow label="Height" value={bio.height} />
              )}
              {bio.weight && (
                <BioRow label="Weight" value={bio.weight} />
              )}
              {bio.draft && (
                <BioRow label="Draft" value={bio.draft} />
              )}
              {bio.experience && (
                <BioRow label="Experience" value={bio.experience} />
              )}
              {(bio.college || bio.birthPlace) && (
                <BioRow
                  label="From"
                  value={bio.college ?? bio.birthPlace}
                  className="col-span-2"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BioRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className="text-white/40">{label}</span>
      <span className="font-medium text-white/70">{value}</span>
    </div>
  );
}
