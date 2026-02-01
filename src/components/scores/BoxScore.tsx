"use client";

import useSWR from "swr";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
  shortName: string;
  jersey: string;
  position: string;
  starter: boolean;
  stats: Record<string, string>;
  didNotPlay: boolean;
  reason: string | null;
}

interface TeamBox {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  players: Player[];
}

interface LineScore {
  abbreviation: string;
  homeAway: string;
  score: string;
  linescores: string[];
}

interface BoxScoreData {
  state: string;
  detail: string;
  teams: TeamBox[];
  lineScores: LineScore[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STAT_COLS = ["MIN", "FG", "3PT", "FT", "REB", "AST", "STL", "BLK", "TO", "PTS"];

function TeamBoxTable({ team }: { team: TeamBox }) {
  const starters = team.players.filter((p) => p.starter && !p.didNotPlay);
  const bench = team.players.filter((p) => !p.starter && !p.didNotPlay);
  const dnp = team.players.filter((p) => p.didNotPlay);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-[11px]">
        <thead>
          <tr className="border-b border-white/5">
            <th className="py-2 pl-3 text-left font-semibold text-white/50">Player</th>
            {STAT_COLS.map((col) => (
              <th key={col} className="px-1.5 py-2 text-right font-semibold text-white/50">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Starters */}
          {starters.map((p) => (
            <PlayerRow key={p.id} player={p} />
          ))}
          {bench.length > 0 && (
            <tr>
              <td
                colSpan={STAT_COLS.length + 1}
                className="py-1.5 pl-3 text-[10px] font-semibold uppercase tracking-wider text-white/30"
              >
                Bench
              </td>
            </tr>
          )}
          {bench.map((p) => (
            <PlayerRow key={p.id} player={p} />
          ))}
          {dnp.length > 0 && (
            <tr>
              <td
                colSpan={STAT_COLS.length + 1}
                className="py-1.5 pl-3 text-[10px] text-white/20"
              >
                DNP: {dnp.map((p) => p.shortName).join(", ")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <tr className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]">
      <td className="whitespace-nowrap py-1.5 pl-3">
        <span className="font-medium text-white">{player.shortName}</span>
        <span className="ml-1.5 text-white/30">{player.position}</span>
      </td>
      {STAT_COLS.map((col) => (
        <td
          key={col}
          className={`px-1.5 py-1.5 text-right font-mono ${
            col === "PTS" ? "font-bold text-white" : "text-white/60"
          }`}
        >
          {player.stats[col] ?? "-"}
        </td>
      ))}
    </tr>
  );
}

export function BoxScore({ gameId }: { gameId: string }) {
  const { data, isLoading } = useSWR<BoxScoreData>(
    `/api/scores/${gameId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data?.teams?.length) {
    return (
      <div className="py-6 text-center text-xs text-white/30">
        Box score not available
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {/* Quarter-by-quarter line score */}
      {data.lineScores?.length > 0 && (
        <div className="overflow-x-auto px-4 py-3">
          <table className="mx-auto text-[11px]">
            <thead>
              <tr>
                <th className="px-3 py-1 text-left font-semibold text-white/50">Team</th>
                {data.lineScores[0]?.linescores?.map((_, i) => (
                  <th key={i} className="px-2 py-1 text-center font-semibold text-white/50">
                    Q{i + 1}
                  </th>
                ))}
                <th className="px-3 py-1 text-center font-bold text-white/70">T</th>
              </tr>
            </thead>
            <tbody>
              {data.lineScores.map((ls) => (
                <tr key={ls.abbreviation}>
                  <td className="px-3 py-1 font-semibold text-white">{ls.abbreviation}</td>
                  {ls.linescores.map((q, i) => (
                    <td key={i} className="px-2 py-1 text-center font-mono text-white/60">
                      {q}
                    </td>
                  ))}
                  <td className="px-3 py-1 text-center font-mono font-bold text-white">
                    {ls.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team box scores */}
      {data.teams.map((team) => (
        <div key={team.id} className="py-2">
          <div className="flex items-center gap-2 px-4 py-2">
            {team.logo && (
              <Image src={team.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
            )}
            <span className="text-xs font-bold text-white">{team.displayName}</span>
          </div>
          <TeamBoxTable team={team} />
        </div>
      ))}
    </div>
  );
}
