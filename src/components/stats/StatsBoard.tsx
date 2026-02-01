"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { LeagueLeaders } from "./LeagueLeaders";
import { ArenaMVPs } from "./ArenaMVPs";
import { RewardPower } from "./RewardPower";

const tabs = [
  { value: "leaders", label: "League Leaders" },
  { value: "arena", label: "Arena MVPs" },
  { value: "power", label: "Reward Power" },
];

export function StatsBoard() {
  return (
    <Tabs.Root defaultValue="leaders">
      <Tabs.List className="mb-6 flex border-b border-white/10">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-white/60 data-[state=active]:border-b-2 data-[state=active]:border-[#FFD700] data-[state=active]:text-white"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="leaders">
        <LeagueLeaders />
      </Tabs.Content>

      <Tabs.Content value="arena">
        <ArenaMVPs />
      </Tabs.Content>

      <Tabs.Content value="power">
        <RewardPower />
      </Tabs.Content>
    </Tabs.Root>
  );
}
