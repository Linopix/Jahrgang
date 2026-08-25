export type EraId =
  | "all"
  | "classic"
  | "eighties"
  | "nineties"
  | "two-thousands"
  | "today"
  | "german";

export type GameMode = "party" | "solo";

export type Phase =
  | "home"
  | "setup"
  | "loading"
  | "listen"
  | "reveal"
  | "winner";

export interface CatalogSong {
  id: string;
  title: string;
  artist: string;
  year: number;
  german?: boolean;
}

export interface ResolvedSong extends CatalogSong {
  previewUrl: string;
  artworkUrl?: string;
}

export interface Player {
  id: string;
  name: string;
  timeline: ResolvedSong[];
  tokens: number;
  misses: number;
}

export interface SetupConfig {
  mode: GameMode;
  names: string[];
  ids?: string[];
  target: 6 | 8 | 10;
  era: EraId;
}

export interface LastResult {
  correct: boolean;
  song: ResolvedSong;
  slot: number;
}

export interface GameSnapshot {
  phase: Phase;
  mode: GameMode;
  era: EraId;
  target: number;
  players: Player[];
  currentPlayerIndex: number;
  deck: ResolvedSong[];
  current: ResolvedSong | null;
  lastResult: LastResult | null;
  decadeHint: string | null;
}

export const ERA_LABELS: Record<EraId, string> = {
  all: "Alles",
  classic: "Klassiker · bis 1979",
  eighties: "1980er",
  nineties: "1990er",
  "two-thousands": "2000er",
  today: "2010 bis heute",
  german: "Deutsch",
};

export const TARGET_OPTIONS = [6, 8, 10] as const;
export const STARTING_TOKENS = 2;
export const SOLO_LIVES = 3;
export const DEFAULT_TARGET = 8;
