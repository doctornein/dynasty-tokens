"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GlowButton } from "@/components/ui/GlowButton";
import { useArenaStore } from "@/stores/arenaStore";
import { useAuthStore } from "@/stores/authStore";
import { ArenaGameType, ArenaStatCategory } from "@/types";
import { StatCategoryPicker } from "./StatCategoryPicker";
import { DateRangePicker } from "./DateRangePicker";
import { CardPickerGrid } from "./CardPickerGrid";
import { formatTokenAmount } from "@/lib/formatters";

interface CreateMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "type" | "stats" | "cards" | "details";

const GAME_TYPES: { value: ArenaGameType; label: string; count: number }[] = [
  { value: "1v1", label: "1v1", count: 1 },
  { value: "3v3", label: "3v3", count: 3 },
  { value: "5v5", label: "5v5", count: 5 },
];

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

  const cardCount = GAME_TYPES.find((g) => g.value === gameType)?.count ?? 1;

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
            ← Back to format
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
            ← Back to stats
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
            ← Back to cards
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

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

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
