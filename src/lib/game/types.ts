export type EraId =
  | "all"
  | "classic"
  | "eighties"
  | "nineties"
  | "two-thousands"
  | "tens"
  | "today"
  | "german"
  | "pop"
  | "rock"
  | "rap"
  | "dance"
  | "party"
  | "charts"
  | "tiktok-2024"
  | "tiktok-2025"
  | "rap-charts"
  | "mix"
  | "playlist";

export type GenreId = "all" | "pop" | "rock" | "rap" | "dance" | "german";

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

export type Genre = Exclude<GenreId, "all" | "german">;

export interface CatalogSong {
  id: string;
  title: string;
  artist: string;
  year: number;
  german?: boolean;
  genre?: Genre;
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

export interface MixFilter {
  from: number;
  to: number;
  genre: GenreId;
}

export interface SetupConfig {
  mode: GameMode;
  names: string[];
  ids?: string[];
  target: 6 | 8 | 10;
  era: EraId;
  variant: PlayVariant;
  tokens: TokenCount;
  playlistUrl?: string;
  mixFrom?: number;
  mixTo?: number;
  mixGenre?: GenreId;
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
  playlistUrl: string;
  playlistLabel: string;
  mixFrom: number;
  mixTo: number;
  mixGenre: GenreId;
}

export const ERA_IDS: EraId[] = [
  "all",
  "classic",
  "eighties",
  "nineties",
  "two-thousands",
  "tens",
  "today",
  "german",
  "pop",
  "rock",
  "rap",
  "dance",
  "party",
  "charts",
  "tiktok-2024",
  "tiktok-2025",
  "rap-charts",
  "mix",
  "playlist",
];

export const ERA_LABELS: Record<EraId, string> = {
  all: "Alles",
  classic: "Klassiker",
  eighties: "1980er",
  nineties: "1990er",
  "two-thousands": "2000er",
  tens: "2010er",
  today: "2020er",
  german: "Deutsch",
  pop: "Pop",
  rock: "Rock",
  rap: "Rap",
  dance: "Dance",
  party: "Party",
  charts: "Charts",
  "tiktok-2024": "TikTok 2024",
  "tiktok-2025": "TikTok 2025",
  "rap-charts": "Rap Charts",
  mix: "Mix",
  playlist: "Spotify",
};

export const ERA_BLURBS: Record<EraId, string> = {
  all: "Der ganze Katalog.",
  classic: "Bis 1979.",
  eighties: "1980 bis 1989.",
  nineties: "1990 bis 1999.",
  "two-thousands": "2000 bis 2009.",
  tens: "2010 bis 2019.",
  today: "Ab 2020.",
  german: "Deutschsprachige Titel.",
  pop: "Pop über die Jahrzehnte.",
  rock: "Rock, Alternative, Metal.",
  rap: "Hip-Hop und Rap.",
  dance: "Dance, Disco, elektronische Hits.",
  party: "Laut, bekannt, für den Abend.",
  charts: "Große Single-Hits ab 2015.",
  "tiktok-2024": "Virale Titel von 2024.",
  "tiktok-2025": "Virale Titel von 2025.",
  "rap-charts": "Hip-Hop-Hits der letzten Jahre.",
  mix: "Zeitraum und Genre selbst wählen.",
  playlist: "Öffentliche Spotify- oder Deezer-Playlist.",
};

export const PACK_GROUPS: { title: string; ids: EraId[] }[] = [
  {
    title: "Zeit",
    ids: ["classic", "eighties", "nineties", "two-thousands", "tens", "today"],
  },
  {
    title: "Stil",
    ids: ["pop", "rock", "rap", "dance", "german"],
  },
  {
    title: "Kits",
    ids: ["all", "party", "charts", "tiktok-2024", "tiktok-2025", "rap-charts"],
  },
  {
    title: "Eigene",
    ids: ["mix", "playlist"],
  },
];

export const VARIANT_LABELS: Record<PlayVariant, string> = {
  timeline: "Zeitstrahl",
  original: "Original",
};

export const VARIANT_BLURBS: Record<PlayVariant, string> = {
  timeline: "Nur das Erscheinungsjahr. Das Cover darf während des Hörens sichtbar sein.",
  original: "Interpret und Titel raten, danach einordnen. Das Cover bleibt bis zum Aufdecken verdeckt.",
};

export const GENRE_LABELS: Record<GenreId, string> = {
  all: "Alle",
  pop: "Pop",
  rock: "Rock",
  rap: "Rap",
  dance: "Dance",
  german: "Deutsch",
};

export const DECADE_OPTIONS = [1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;
export const TARGET_OPTIONS = [6, 8, 10] as const;
export const TOKEN_OPTIONS = [0, 1, 2] as const;
export const DEFAULT_TARGET = 8;
export const DEFAULT_TOKENS: TokenCount = 2;
export const DEFAULT_VARIANT: PlayVariant = "timeline";
export const DEFAULT_MIX_FROM = 1980;
export const DEFAULT_MIX_TO = 2020;
export const SOLO_LIVES = 3;

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  era: "all",
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: DEFAULT_TOKENS,
  playlistUrl: "",
  playlistLabel: "",
  mixFrom: DEFAULT_MIX_FROM,
  mixTo: DEFAULT_MIX_TO,
  mixGenre: "all",
};

export function isPlayVariant(value: unknown): value is PlayVariant {
  return value === "timeline" || value === "original";
}

export function isTokenCount(value: unknown): value is TokenCount {
  return value === 0 || value === 1 || value === 2;
}

export function isEraId(value: unknown): value is EraId {
  return typeof value === "string" && (ERA_IDS as string[]).includes(value);
}

export function isGenreId(value: unknown): value is GenreId {
  return (
    value === "all" ||
    value === "pop" ||
    value === "rock" ||
    value === "rap" ||
    value === "dance" ||
    value === "german"
  );
}

export function decadeLabelYear(year: number) {
  if (year >= 2020) return "2020er";
  if (year >= 2010) return "2010er";
  return `${String(year).slice(2)}er`;
}
