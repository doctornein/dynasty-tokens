"use client";

import { useMemo } from "react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface Preset {
  label: string;
  start: string;
  end: string;
}

function getPresets(): Preset[] {
  const now = new Date();
  const today = toDateStr(now);

  // This week: today → next Sunday
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const thisWeekEnd = new Date(now);
  thisWeekEnd.setDate(now.getDate() + daysUntilSunday);

  // Next week: next Monday → next Sunday
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + (dayOfWeek === 0 ? 1 : 8 - dayOfWeek));
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  // Next month: 1st → last day
  const nextMonth1st = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthLast = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  return [
    { label: "Today Only", start: today, end: today },
    { label: "This Week", start: today, end: toDateStr(thisWeekEnd) },
    { label: "Next Week", start: toDateStr(nextMonday), end: toDateStr(nextSunday) },
    { label: "Next Month", start: toDateStr(nextMonth1st), end: toDateStr(nextMonthLast) },
  ];
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const today = new Date().toISOString().split("T")[0];
  const presets = useMemo(() => getPresets(), []);

  const activePreset = presets.find(
    (p) => p.start === startDate && p.end === endDate
  );

  const applyPreset = (preset: Preset) => {
    onStartDateChange(preset.start);
    onEndDateChange(preset.end);
  };

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isActive = activePreset?.label === preset.label;
          return (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Date inputs */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-white/40">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={today}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 [color-scheme:dark]"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-white/40">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate || today}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
}
