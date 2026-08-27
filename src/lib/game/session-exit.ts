import { create } from "zustand";
import type { Player, SeriesStanding, SessionStats } from "./types";
import { emptyStats } from "./types";

export type ExitKind = "left" | "evening";

export type ExitState = {
  kind: ExitKind | null;
  name: string;
  player: Player | null;
  place: number;
  stats: SessionStats;
  roundStats: SessionStats;
  series: SeriesStanding[];
  showLeft: (input: {
    name: string;
    player: Player | null;
    place: number;
    stats: SessionStats;
    roundStats: SessionStats;
    series: SeriesStanding[];
  }) => void;
  showEvening: (series: SeriesStanding[]) => void;
  clear: () => void;
};

export const useSessionExit = create<ExitState>((set) => ({
  kind: null,
  name: "",
  player: null,
  place: 0,
  stats: emptyStats(0),
  roundStats: emptyStats(0),
  series: [],
  showLeft: (input) =>
    set({
      kind: "left",
      name: input.name,
      player: input.player,
      place: input.place,
      stats: input.stats,
      roundStats: input.roundStats,
      series: input.series,
    }),
  showEvening: (series) =>
    set({
      kind: "evening",
      name: "",
      player: null,
      place: 0,
      series,
    }),
  clear: () =>
    set({
      kind: null,
      name: "",
      player: null,
      place: 0,
      stats: emptyStats(0),
      roundStats: emptyStats(0),
      series: [],
    }),
}));
