"use client";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
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
  );
}
