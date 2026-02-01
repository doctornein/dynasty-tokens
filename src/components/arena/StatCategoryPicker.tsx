"use client";

import { ArenaStatCategory } from "@/types";

const CATEGORIES: ArenaStatCategory[] = ["PTS", "REB", "AST", "STL", "BLK"];

interface StatCategoryPickerProps {
  selected: ArenaStatCategory[];
  onChange: (categories: ArenaStatCategory[]) => void;
}

export function StatCategoryPicker({ selected, onChange }: StatCategoryPickerProps) {
  const toggle = (cat: ArenaStatCategory) => {
    if (selected.includes(cat)) {
      if (selected.length > 1) {
        onChange(selected.filter((c) => c !== cat));
      }
    } else {
      onChange([...selected, cat]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border border-orange-500/30 bg-orange-500/20 text-orange-400"
                : "border border-transparent bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
