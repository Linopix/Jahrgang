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
  | "soul"
  | "metal"
  | "indie"
  | "latin"
  | "schlager"
  | "party"
  | "charts"
  | "rap-charts"
  | "mix"
  | "playlist";

export type GenreId =
  | "all"
  | "pop"
  | "rock"
  | "rap"
  | "dance"
  | "soul"
  | "metal"
  | "indie"
  | "latin"
  | "schlager"
  | "german";

export type GameMode = "party" | "solo";

export type PlayVariant = "timeline" | "blind" | "original" | "star" | "hook" | "wild" | "custom";

export type GuessKind = "none" | "both" | "artist" | "title";

export type LineRule = "chrono" | "reverse" | "free";

export type CustomRules = {
  guess: GuessKind;
  cover: boolean;
  line: LineRule;
  hideYear: boolean;
  warp: boolean;
  open: boolean;
};

export const DEFAULT_CUSTOM: CustomRules = {
  guess: "both",
  cover: false,
  line: "free",
  hideYear: false,
  warp: false,
  open: true,
};

export type TokenCount = 0 | 1 | 2;

export type NextRoundPolicy = "host" | "all";

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
  custom?: CustomRules;
}

export interface SeriesStanding {
  id: string;
  name: string;
  wins: number;
  points: number;
}

export interface SessionStats {
  startedAt: number;
  heard: number;
  placedOk: number;
  placedBad: number;
  quizHits: number;
  quizAsked: number;
  skips: number;
  hints: number;
}

export const EMPTY_STATS: SessionStats = {
  startedAt: 0,
  heard: 0,
  placedOk: 0,
  placedBad: 0,
  quizHits: 0,
  quizAsked: 0,
  skips: 0,
  hints: 0,
};

export function emptyStats(startedAt = Date.now()): SessionStats {
  return { ...EMPTY_STATS, startedAt };
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
  series: SeriesStanding[];
  stats: SessionStats;
  roundStats: SessionStats;
  custom?: CustomRules;
}

export interface RoomConfig {
  era: EraId;
  target: 6 | 8 | 10;
  variant: PlayVariant;
  tokens: TokenCount;
  nextRound: NextRoundPolicy;
  playlistUrl: string;
  playlistLabel: string;
  mixFrom: number;
  mixTo: number;
  mixGenre: GenreId;
  custom: CustomRules;
  emoji: boolean;
  chat: boolean;
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
  "soul",
  "metal",
  "indie",
  "latin",
  "schlager",
  "party",
  "charts",
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
  soul: "Soul",
  metal: "Metal",
  indie: "Indie",
  latin: "Latin",
  schlager: "Schlager",
  party: "Party",
  charts: "Charts",
  "rap-charts": "Rap Charts",
  mix: "Mix",
  playlist: "Playlist",
};

export const ERA_BLURBS: Record<EraId, string> = {
  all: "Alles.",
  classic: "Bis 1979.",
  eighties: "1980–89.",
  nineties: "1990–99.",
  "two-thousands": "2000–09.",
  tens: "2010–19.",
  today: "Ab 2020.",
  german: "Deutsch.",
  pop: "Pop.",
  rock: "Rock.",
  rap: "Rap.",
  dance: "Dance.",
  soul: "Soul.",
  metal: "Metal.",
  indie: "Indie.",
  latin: "Latin.",
  schlager: "Schlager.",
  party: "Laut.",
  charts: "Hits ab 2015.",
  "rap-charts": "Rap der letzten Jahre.",
  mix: "Jahre und Genre selbst.",
  playlist: "Spotify, Deezer oder Liste.",
};

export const PACK_GROUPS: { title: string; ids: EraId[] }[] = [
  {
    title: "Zeit",
    ids: ["classic", "eighties", "nineties", "two-thousands", "tens", "today"],
  },
  {
    title: "Stil",
    ids: ["pop", "rock", "rap", "dance", "soul", "metal", "indie", "latin", "schlager", "german"],
  },
  {
    title: "Kits",
    ids: ["all", "party", "charts", "rap-charts"],
  },
  {
    title: "Eigene",
    ids: ["mix", "playlist"],
  },
];

export const VARIANT_IDS: PlayVariant[] = [
  "timeline",
  "blind",
  "original",
  "star",
  "hook",
  "wild",
  "custom",
];

export const VARIANT_LABELS: Record<PlayVariant, string> = {
  timeline: "Zeitstrahl",
  blind: "Blind",
  original: "Kenner",
  star: "Star",
  hook: "Titel",
  wild: "Verrückter",
  custom: "Custom",
};

export const VARIANT_BLURBS: Record<PlayVariant, string> = {
  timeline: "Nur das Jahr. Cover an.",
  blind: "Nur das Jahr. Cover zu.",
  original: "Interpret und Titel, dann legen.",
  star: "Nur Interpret, dann legen.",
  hook: "Nur Titel, dann legen.",
  wild: "Raten, Cover zu, Jahre weg, Tempo spinnt.",
  custom: "Alles selbst.",
};

export type ResolvedRules = {
  guess: GuessKind;
  hideCover: boolean;
  reverse: boolean;
  free: boolean;
  hideYear: boolean;
  warp: boolean;
  open: boolean;
};

export function parseCustom(raw: unknown): CustomRules {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CUSTOM };
  const row = raw as Partial<CustomRules>;
  return {
    guess: row.guess === "none" || row.guess === "artist" || row.guess === "title" || row.guess === "both" ? row.guess : DEFAULT_CUSTOM.guess,
    cover: typeof row.cover === "boolean" ? row.cover : DEFAULT_CUSTOM.cover,
    line: row.line === "chrono" || row.line === "reverse" || row.line === "free" ? row.line : DEFAULT_CUSTOM.line,
    hideYear: typeof row.hideYear === "boolean" ? row.hideYear : DEFAULT_CUSTOM.hideYear,
    warp: typeof row.warp === "boolean" ? row.warp : DEFAULT_CUSTOM.warp,
    open: typeof row.open === "boolean" ? row.open : DEFAULT_CUSTOM.open,
  };
}

export function rulesFor(variant: PlayVariant, custom?: CustomRules): ResolvedRules {
  if (variant === "custom") {
    const c = parseCustom(custom);
    return {
      guess: c.guess,
      hideCover: c.cover,
      reverse: c.line === "reverse",
      free: c.line === "free",
      hideYear: c.hideYear,
      warp: c.warp,
      open: c.open,
    };
  }
  return {
    guess: variant === "original" || variant === "wild" ? "both" : variant === "star" ? "artist" : variant === "hook" ? "title" : "none",
    hideCover: variant !== "timeline",
    reverse: variant === "wild",
    free: false,
    hideYear: variant === "wild",
    warp: variant === "wild",
    open: false,
  };
}

export function hidesCover(variant: PlayVariant, custom?: CustomRules) {
  return rulesFor(variant, custom).hideCover;
}

export function guessKind(variant: PlayVariant, custom?: CustomRules): GuessKind {
  return rulesFor(variant, custom).guess;
}

export function reversesTimeline(variant: PlayVariant, custom?: CustomRules) {
  return rulesFor(variant, custom).reverse;
}

export function freePlace(variant: PlayVariant, custom?: CustomRules) {
  return rulesFor(variant, custom).free;
}

export function openPlay(variant: PlayVariant, custom?: CustomRules) {
  return rulesFor(variant, custom).open;
}

export const GENRE_IDS: GenreId[] = [
  "all",
  "pop",
  "rock",
  "rap",
  "dance",
  "soul",
  "metal",
  "indie",
  "latin",
  "schlager",
  "german",
];

export const GENRE_LABELS: Record<GenreId, string> = {
  all: "Alle",
  pop: "Pop",
  rock: "Rock",
  rap: "Rap",
  dance: "Dance",
  soul: "Soul",
  metal: "Metal",
  indie: "Indie",
  latin: "Latin",
  schlager: "Schlager",
  german: "Deutsch",
};

export const GENRE_BLURBS: Record<GenreId, string> = {
  all: "Kein Filter.",
  pop: "Pop.",
  rock: "Rock.",
  rap: "Rap.",
  dance: "Dance.",
  soul: "Soul.",
  metal: "Metal.",
  indie: "Indie.",
  latin: "Latin.",
  schlager: "Schlager.",
  german: "Deutsch.",
};

export const NEXT_ROUND_OPTIONS = ["host", "all"] as const;
export const NEXT_ROUND_LABELS: Record<NextRoundPolicy, string> = {
  host: "Nur Host",
  all: "Alle",
};
export const NEXT_ROUND_BLURB: Record<NextRoundPolicy, string> = {
  host: "Nur der Host legt die nächste Platte auf.",
  all: "Jeder darf weiter.",
};

export const YEAR_MIN = 1960;
export const YEAR_MAX = new Date().getFullYear();
export const TARGET_OPTIONS = [6, 8, 10] as const;
export const TOKEN_OPTIONS = [0, 1, 2] as const;
export const DEFAULT_TARGET = 8;
export const DEFAULT_TOKENS: TokenCount = 2;
export const DEFAULT_VARIANT: PlayVariant = "timeline";
export const DEFAULT_NEXT_ROUND: NextRoundPolicy = "host";
export const DEFAULT_MIX_FROM = 1980;
export const DEFAULT_MIX_TO = YEAR_MAX;
export const SOLO_LIVES = 3;

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  era: "all",
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: DEFAULT_TOKENS,
  nextRound: DEFAULT_NEXT_ROUND,
  playlistUrl: "",
  playlistLabel: "",
  mixFrom: DEFAULT_MIX_FROM,
  mixTo: DEFAULT_MIX_TO,
  mixGenre: "all",
  custom: DEFAULT_CUSTOM,
  emoji: true,
  chat: true,
};

export function isPlayVariant(value: unknown): value is PlayVariant {
  return typeof value === "string" && (VARIANT_IDS as string[]).includes(value);
}

export function isTokenCount(value: unknown): value is TokenCount {
  return value === 0 || value === 1 || value === 2;
}

export function isNextRoundPolicy(value: unknown): value is NextRoundPolicy {
  return value === "host" || value === "all";
}

export function isEraId(value: unknown): value is EraId {
  return typeof value === "string" && (ERA_IDS as string[]).includes(value);
}

export function isGenreId(value: unknown): value is GenreId {
  return typeof value === "string" && (GENRE_IDS as string[]).includes(value);
}

export function decadeLabelYear(year: number) {
  if (year >= 2020) return "2020er";
  if (year >= 2010) return "2010er";
  return `${String(year).slice(2)}er`;
}
