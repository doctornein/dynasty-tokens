"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { ArenaGameType, ArenaStatCategory, ScheduleEntry } from "@/types";
import { StatCategoryPicker } from "./StatCategoryPicker";
import { DateRangePicker } from "./DateRangePicker";
import { CardPickerGrid } from "./CardPickerGrid";
import { formatTokenAmount } from "@/lib/formatters";
import { players } from "@/data/players";
import { resolveLegacyId } from "@/data/legacy-id-map";
import useSWR from "swr";
import { CalendarDays } from "lucide-react";

interface CreateMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "type" | "stats" | "cards" | "details";
type DateMode = "range" | "games";

const GAME_TYPES: { value: ArenaGameType; label: string; count: number }[] = [
  { value: "1v1", label: "1v1", count: 1 },
  { value: "3v3", label: "3v3", count: 3 },
  { value: "5v5", label: "5v5", count: 5 },
];

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    return r.json();
  });

function useTeamSchedules(teamAbbrs: string[]) {
  // Create a stable key from sorted unique abbrs
  const uniqueAbbrs = [...new Set(teamAbbrs)].sort();
  const results = new Map<string, ScheduleEntry[]>();

  // Fetch each schedule individually with SWR
  // We need to call hooks unconditionally, so pad to max 5
  const padded = [...uniqueAbbrs, null, null, null, null, null].slice(0, 5);

  const r0 = useSWR<ScheduleEntry[]>(
    padded[0] ? `/api/teams/${padded[0]}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const r1 = useSWR<ScheduleEntry[]>(
    padded[1] ? `/api/teams/${padded[1]}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const r2 = useSWR<ScheduleEntry[]>(
    padded[2] ? `/api/teams/${padded[2]}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const r3 = useSWR<ScheduleEntry[]>(
    padded[3] ? `/api/teams/${padded[3]}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  const r4 = useSWR<ScheduleEntry[]>(
    padded[4] ? `/api/teams/${padded[4]}/schedule` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const all = [r0, r1, r2, r3, r4];
  for (let i = 0; i < uniqueAbbrs.length; i++) {
    if (all[i].data) {
      results.set(uniqueAbbrs[i], all[i].data!);
    }
  }

  return results;
}

export function CreateMatchModal({ open, onOpenChange }: CreateMatchModalProps) {
  const createMatch = useArenaStore((s) => s.createMatch);
  const balance = useAuthStore((s) => s.getBalance());

  const [step, setStep] = useState<Step>("type");
  const [gameType, setGameType] = useState<ArenaGameType>("1v1");
  const [statCategories, setStatCategories] = useState<ArenaStatCategory[]>(["PTS"]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [wager, setWager] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invitedUsername, setInvitedUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New: date mode and game count
  const [dateMode, setDateMode] = useState<DateMode>("range");
  const [gameCount, setGameCount] = useState("5");

  const cardCount = GAME_TYPES.find((g) => g.value === gameType)?.count ?? 1;

  // Resolve selected player IDs to player objects
  const selectedPlayers = useMemo(() => {
    return selectedCards
      .map((id) => {
        const resolvedId = resolveLegacyId(id);
        return players.find((p) => p.id === resolvedId || p.id === id);
      })
      .filter((p) => p !== undefined);
  }, [selectedCards]);

  // Get unique team abbreviations from selected players
  const teamAbbrs = useMemo(() => {
    return [...new Set(selectedPlayers.map((p) => p.teamAbbr))];
  }, [selectedPlayers]);

  // Fetch schedules for selected teams
  const schedules = useTeamSchedules(step === "details" ? teamAbbrs : []);

  // Count games in date range per player
  const gameCountsPerPlayer = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    return selectedPlayers.map((player) => {
      const schedule = schedules.get(player.teamAbbr);
      if (!schedule) return { player, count: null };
      const gamesInRange = schedule.filter((entry) => {
        const gameDate = new Date(entry.date);
        return gameDate >= start && gameDate <= end;
      });
      return { player, count: gamesInRange.length };
    });
  }, [selectedPlayers, schedules, startDate, endDate]);

  // For "number of games" mode: compute end date from schedules
  const computedEndDate = useMemo(() => {
    if (dateMode !== "games" || !startDate) return null;
    const n = parseInt(gameCount) || 0;
    if (n <= 0) return null;

    let latestDate: Date | null = null;

    for (const player of selectedPlayers) {
      const schedule = schedules.get(player.teamAbbr);
      if (!schedule) return null; // Still loading

      const startD = new Date(startDate + "T00:00:00");
      const futureGames = schedule.filter(
        (entry) => new Date(entry.date) >= startD
      );

      if (futureGames.length < n) {
        // Not enough games in schedule
        return "insufficient";
      }

      const nthGame = futureGames[n - 1];
      const nthDate = new Date(nthGame.date);
      if (!latestDate || nthDate > latestDate) {
        latestDate = nthDate;
      }
    }

    return latestDate ? latestDate.toISOString().split("T")[0] : null;
  }, [dateMode, startDate, gameCount, selectedPlayers, schedules]);

  // Sync computed end date
  useEffect(() => {
    if (dateMode === "games" && computedEndDate && computedEndDate !== "insufficient") {
      setEndDate(computedEndDate);
    }
  }, [dateMode, computedEndDate]);

  const reset = () => {
    setStep("type");
    setGameType("1v1");
    setStatCategories(["PTS"]);
    setSelectedCards([]);
    setWager("10");
    setStartDate("");
    setEndDate("");
    setInvitedUsername("");
    setError("");
    setDateMode("range");
    setGameCount("5");
  };

  const handleSubmit = async () => {
    setError("");

    const w = Number(wager);
    if (isNaN(w) || w < 5) {
      setError("Minimum wager is 5 DT");
      return;
    }

    if (w > balance) {
      setError("Insufficient balance");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be on or after start date");
      return;
    }

    setSubmitting(true);
    const result = await createMatch(
      gameType,
      statCategories,
      startDate,
      endDate,
      w,
      selectedCards,
      invitedUsername || undefined
    );
    setSubmitting(false);

    if (result.success) {
      onOpenChange(false);
      reset();
    } else {
      setError(result.error ?? "Failed to create challenge");
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Create Challenge"
      className="max-w-2xl"
    >
      {/* Step 1: Game Type */}
      {step === "type" && (
        <div className="space-y-4">
          <p className="text-sm text-white/40">Choose your matchup format</p>
          <div className="flex gap-3">
            {GAME_TYPES.map((gt) => (
              <button
                key={gt.value}
                onClick={() => setGameType(gt.value)}
                className={`flex-1 rounded-xl border p-4 text-center transition-colors ${
                  gameType === gt.value
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl font-bold">{gt.label}</div>
                <div className="text-xs">
                  {gt.count} player{gt.count > 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
          <GlowButton
            variant="orange"
            onClick={() => setStep("stats")}
            className="w-full"
          >
            Next: Pick Stats
          </GlowButton>
        </div>
      )}

      {/* Step 2: Stat Categories */}
      {step === "stats" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("type")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to format
          </button>
          <p className="text-sm text-white/40">
            Select which stat categories count toward the score
          </p>
          <StatCategoryPicker
            selected={statCategories}
            onChange={setStatCategories}
          />
          <GlowButton
            variant="orange"
            onClick={() => {
              setSelectedCards([]);
              setStep("cards");
            }}
            className="w-full"
          >
            Next: Pick Cards
          </GlowButton>
        </div>
      )}

      {/* Step 3: Card Selection */}
      {step === "cards" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("stats")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to stats
          </button>
          <p className="text-sm text-white/40">
            Select {cardCount} player{cardCount > 1 ? "s" : ""} for your lineup
          </p>
          <CardPickerGrid
            maxSelection={cardCount}
            selected={selectedCards}
            onSelectionChange={setSelectedCards}
          />
          <GlowButton
            variant="orange"
            onClick={() => setStep("details")}
            disabled={selectedCards.length !== cardCount}
            className="w-full"
          >
            Next: Set Wager & Dates
          </GlowButton>
        </div>
      )}

      {/* Step 4: Wager, Dates, Invite */}
      {step === "details" && (
        <div className="space-y-4">
          <button
            onClick={() => setStep("cards")}
            className="text-xs text-orange-400 hover:underline"
          >
            &larr; Back to cards
          </button>

          {/* Summary */}
          <div className="rounded-xl bg-white/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
                {gameType}
              </span>
              {statCategories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="text-xs text-white/40">
              {selectedCards.length} player{selectedCards.length > 1 ? "s" : ""} selected
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40">Wager (DT)</label>
            <input
              type="number"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              min="5"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50"
            />
            <div className="mt-1 text-[10px] text-white/30">
              Balance: {formatTokenAmount(balance)} · Min: 5 DT
            </div>
          </div>

          {/* Date Mode Toggle */}
          <div className="flex rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => {
                setDateMode("range");
                setEndDate("");
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateMode === "range"
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Date Range
            </button>
            <button
              onClick={() => {
                setDateMode("games");
                setEndDate("");
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateMode === "games"
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              # of Games
            </button>
          </div>

          {dateMode === "range" ? (
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-white/40">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-white/40">
                    Number of Games
                  </label>
                  <input
                    type="number"
                    value={gameCount}
                    onChange={(e) => setGameCount(e.target.value)}
                    min="1"
                    max="82"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50"
                  />
                </div>
              </div>
              {computedEndDate === "insufficient" && (
                <div className="text-xs text-red-400">
                  Not enough scheduled games for this count
                </div>
              )}
              {computedEndDate &&
                computedEndDate !== "insufficient" && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-white/60">
                      Computed end date:{" "}
                      <span className="font-medium text-white">
                        {new Date(computedEndDate + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Game count per player in range */}
          {startDate && endDate && gameCountsPerPlayer.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                Games in Range
              </div>
              {gameCountsPerPlayer.map(({ player, count }) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-white/60">
                    {player.name}{" "}
                    <span className="text-white/30">({player.teamAbbr})</span>
                  </span>
                  <span
                    className={`font-medium ${
                      count === null
                        ? "text-white/30"
                        : count === 0
                          ? "text-red-400"
                          : count <= 2
                            ? "text-yellow-400"
                            : "text-green-400"
                    }`}
                  >
                    {count === null ? "..." : `${count} game${count !== 1 ? "s" : ""}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-white/40">
              Invite User (optional)
            </label>
            <input
              type="text"
              value={invitedUsername}
              onChange={(e) => setInvitedUsername(e.target.value)}
              placeholder="Leave empty for open challenge"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-orange-500/50"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <GlowButton
            variant="orange"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating Challenge..." : "Create Challenge"}
          </GlowButton>
        </div>
      )}
    </Modal>
  );
}
