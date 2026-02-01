"use client";

import { Position } from "@/types";
import { teams } from "@/data/teams";

interface FiltersProps {
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  selectedPosition: string;
  onPositionChange: (pos: string) => void;
}

const positions: Position[] = ["PG", "SG", "SF", "PF", "C"];

export function Filters({
  selectedTeam, onTeamChange,
  selectedPosition, onPositionChange,
}: FiltersProps) {
  const selectClass = "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none transition-colors focus:border-[#00D4FF]/50 hover:bg-white/10";

  return (
    <div className="flex flex-wrap gap-3">
      <select value={selectedTeam} onChange={(e) => onTeamChange(e.target.value)} className={selectClass}>
        <option value="">All Teams</option>
        {teams.map((t) => (
          <option key={t.abbr} value={t.abbr}>{t.abbr}</option>
        ))}
      </select>

      <select value={selectedPosition} onChange={(e) => onPositionChange(e.target.value)} className={selectClass}>
        <option value="">All Positions</option>
        {positions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}
