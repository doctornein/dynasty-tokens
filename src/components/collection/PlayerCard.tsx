"use client";

import { useRef, useState } from "react";
import Image, { ImageProps } from "next/image";
import { motion } from "framer-motion";
import { Player } from "@/types";
import { CARD_COLORS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { User } from "lucide-react";

function HeadshotImage({ fallbackClassName, ...props }: ImageProps & { fallbackClassName?: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <User className={cn("text-white/10", fallbackClassName)} strokeWidth={1} />
      </div>
    );
  }
  return <Image {...props} onError={() => setError(true)} />;
}

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  compact?: boolean;
}

export function PlayerCard({ player, onClick, compact = false }: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-[#12121a] transition-shadow duration-300",
      )}
      style={{
        borderColor: `${CARD_COLORS.blue}50`,
        boxShadow: `0 0 8px ${CARD_COLORS.glow}`,
        transformStyle: "preserve-3d",
      }}
      whileHover={{
        boxShadow: `0 0 20px ${CARD_COLORS.glow}, 0 0 40px ${CARD_COLORS.glowRed}`,
      }}
    >
      {/* Headshot area */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          compact ? "h-36" : "h-52",
        )}
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fallbackClassName={cn("text-white/10", compact ? "h-20 w-20" : "h-28 w-28")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User
              className={cn("text-white/10", compact ? "h-20 w-20" : "h-28 w-28")}
              strokeWidth={1}
            />
          </div>
        )}

        {/* Gradient fade at bottom of headshot */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: "linear-gradient(to top, #12121a, transparent)" }}
        />

        {/* Position badge */}
        <div
          className="absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-xs font-bold backdrop-blur-sm"
          style={{
            color: CARD_COLORS.blue,
            backgroundColor: `${CARD_COLORS.blue}25`,
            border: `1px solid ${CARD_COLORS.blue}30`,
          }}
        >
          {player.position}
        </div>

        {/* Jersey number */}
        <div className="absolute right-2.5 top-2.5 text-2xl font-black text-white/10">
          #{player.jerseyNumber}
        </div>
      </div>

      {/* Info section */}
      <div className={cn("px-4 pb-4", compact ? "pt-1" : "pt-2")}>
        <h3 className={cn("font-bold text-white", compact ? "text-sm" : "text-base")}>
          {player.name}
        </h3>
        <p className="text-xs text-white/40">{player.teamAbbr}</p>

        {/* Stats */}
        {!compact && (
          <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1 text-[10px] text-white/40">
            {([
              { key: "ppg", label: "PPG" },
              { key: "rpg", label: "RPG" },
              { key: "apg", label: "APG" },
              { key: "spg", label: "SPG" },
              { key: "bpg", label: "BPG" },
              { key: "fgPct", label: "FG%" },
              { key: "fg3Pct", label: "3P%" },
              { key: "ftPct", label: "FT%" },
              { key: "mpg", label: "MPG" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-baseline justify-between">
                <span className="uppercase">{label}</span>
                <span className="font-mono font-bold text-white/60">
                  {player.stats[key].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
