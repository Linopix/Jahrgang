export type EraId =
  | "all"
  | "classic"
  | "eighties"
  | "nineties"
  | "two-thousands"
  | "today"
  | "german";

export type GameMode = "party" | "solo";

export type PlayVariant = "timeline" | "original";

export type TokenCount = 0 | 1 | 2;

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
  quiz: number;
}

export interface SetupConfig {
  mode: GameMode;
  names: string[];
  ids?: string[];
  target: 6 | 8 | 10;
  era: EraId;
  variant: PlayVariant;
  tokens: TokenCount;
}

export interface LastResult {
  correct: boolean;
  song: ResolvedSong;
  slot: number;
  titleGuess?: string;
  artistGuess?: string;
  titleCorrect?: boolean;
  artistCorrect?: boolean;
}

export interface GameSnapshot {
  phase: Phase;
  mode: GameMode;
  era: EraId;
  target: number;
  variant: PlayVariant;
  players: Player[];
  currentPlayerIndex: number;
  deck: ResolvedSong[];
  current: ResolvedSong | null;
  lastResult: LastResult | null;
  decadeHint: string | null;
}

export interface RoomConfig {
  era: EraId;
  target: 6 | 8 | 10;
  variant: PlayVariant;
  tokens: TokenCount;
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

export const VARIANT_LABELS: Record<PlayVariant, string> = {
  timeline: "Zeitstrahl",
  original: "Original",
};

export const VARIANT_BLURBS: Record<PlayVariant, string> = {
  timeline: "Nur das Erscheinungsjahr. Das Cover darf während des Hörens sichtbar sein.",
  original: "Interpret und Titel raten, danach einordnen. Das Cover bleibt bis zum Aufdecken verdeckt.",
};

export const TARGET_OPTIONS = [6, 8, 10] as const;
export const TOKEN_OPTIONS = [0, 1, 2] as const;
export const DEFAULT_TARGET = 8;
export const DEFAULT_TOKENS: TokenCount = 2;
export const DEFAULT_VARIANT: PlayVariant = "timeline";
export const SOLO_LIVES = 3;

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  era: "all",
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: DEFAULT_TOKENS,
};

export function isPlayVariant(value: unknown): value is PlayVariant {
  return value === "timeline" || value === "original";
}

export function isTokenCount(value: unknown): value is TokenCount {
  return value === 0 || value === 1 || value === 2;
}
