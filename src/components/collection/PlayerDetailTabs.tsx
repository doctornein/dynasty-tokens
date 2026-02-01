"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Player } from "@/types";
import { GameLogTab } from "./tabs/GameLogTab";
import { CareerStatsTab } from "./tabs/CareerStatsTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { PlayerRewardsTab } from "./tabs/PlayerRewardsTab";

interface PlayerDetailTabsProps {
  player: Player;
}

export function PlayerDetailTabs({ player }: PlayerDetailTabsProps) {
  return (
    <Tabs.Root defaultValue="game-log" className="flex h-full flex-col">
      <Tabs.List className="flex shrink-0 border-b border-white/10">
        {[
          { value: "game-log", label: "Game Log" },
          { value: "career", label: "Career" },
          { value: "schedule", label: "Schedule" },
          { value: "rewards", label: "Performance Rewards" },
        ].map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-white/60 data-[state=active]:border-b-2 data-[state=active]:border-white/80 data-[state=active]:text-white"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs.Content value="game-log" className="h-full">
          <GameLogTab player={player} />
        </Tabs.Content>
        <Tabs.Content value="career" className="h-full">
          <CareerStatsTab player={player} />
        </Tabs.Content>
        <Tabs.Content value="schedule" className="h-full">
          <ScheduleTab player={player} />
        </Tabs.Content>
        <Tabs.Content value="rewards" className="h-full">
          <PlayerRewardsTab player={player} />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  );
}
