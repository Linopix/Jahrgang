import { emptyStats, type CustomRules, type EraId, type GameSnapshot, type PlayVariant, type ResolvedSong, type TokenCount } from "../game/types.ts";
import { playerOf } from "./engine.ts";
import { type CupMatch, type Tournament } from "./types.ts";

export type CupBoardCard = {
  matchId: string;
  title: string;
  phase: GameSnapshot["phase"] | "idle";
  currentName: string;
  rows: { id: string; name: string; cards: number; quiz: number }[];
};

export function openTable(
  seats: { id: string; name: string }[],
  songs: ResolvedSong[],
  opts: {
    era: EraId;
    target: number;
    variant: PlayVariant;
    custom?: CustomRules;
    tokens: TokenCount;
  },
): GameSnapshot {
  const now = Date.now();
  const players = seats.map((seat, i) => ({
    id: seat.id,
    name: seat.name,
    timeline: songs[i] ? [songs[i]!] : [],
    tokens: opts.tokens,
    misses: 0,
    quiz: 0,
  }));
  const rest = songs.slice(seats.length);
  return {
    phase: "listen",
    mode: "party",
    era: opts.era,
    target: opts.target,
    variant: opts.variant,
    custom: opts.custom,
    players,
    currentPlayerIndex: 0,
    deck: rest.slice(1),
    current: rest[0] ?? null,
    lastResult: null,
    decadeHint: null,
    series: [],
    stats: emptyStats(now),
    roundStats: emptyStats(now),
  };
}

export function boardFromSnapshot(
  match: CupMatch,
  t: Tournament,
  snap: GameSnapshot | undefined,
  title: string,
): CupBoardCard {
  const rows =
    snap?.players.map((row) => ({
      id: row.id,
      name: row.name,
      cards: row.timeline.length,
      quiz: row.quiz ?? 0,
    })) ??
    match.playerIds.map((id) => ({
      id,
      name: playerOf(t, id)?.name ?? "Frei",
      cards: 0,
      quiz: 0,
    }));
  const current = snap?.players[snap.currentPlayerIndex];
  return {
    matchId: match.id,
    title,
    phase: snap?.phase ?? "idle",
    currentName: current?.name ?? "",
    rows,
  };
}
