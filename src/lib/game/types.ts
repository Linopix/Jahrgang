import type { CupAudio, CupFlow, CupGroupSize, CupQualify } from "@/lib/tournament/types";

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
  | "playlist"
  | "likes";

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
export type SuggestMode = "on" | "off" | "loose";
export type StageAudio = "stage" | "all";

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
  spotifyUri?: string;
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
  target: number;
  era: EraId;
  variant: PlayVariant;
  tokens: TokenCount;
  playlistUrl?: string;
  mixFrom?: number;
  mixTo?: number;
  mixGenre?: GenreId;
  custom?: CustomRules;
  extraEra?: EraId | null;
  eras?: EraId[];
  pool?: number;
  suggest?: SuggestMode;
  fullPile?: boolean;
  readyPile?: ResolvedSong[];
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
  jokerEarned?: boolean;
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
  target: number;
  variant: PlayVariant;
  tokens: TokenCount;
  nextRound: NextRoundPolicy;
  playlistUrl: string;
  playlistLabel: string;
  mixFrom: number;
  mixTo: number;
  mixGenre: GenreId;
  custom: CustomRules;
  extraEra: EraId | null;
  eras: EraId[];
  pool: number;
  emoji: boolean;
  chat: boolean;
  tv: boolean;
  suggest: SuggestMode;
  stageAudio: StageAudio;
  cup: boolean;
  cupSize: CupGroupSize;
  cupQualify: CupQualify;
  cupFlow: CupFlow;
  cupAudio: CupAudio;
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
  "likes",
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
  likes: "Meine Titel",
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
  rock: "Rock, Alternative, Classic Rock.",
  rap: "Hip-Hop und Rap.",
  dance: "Dance, Disco, elektronische Hits.",
  soul: "Soul, R&B, Funk.",
  metal: "Metal und härterer Rock.",
  indie: "Indie.",
  latin: "Latin und Reggaeton.",
  schlager: "Schlager und Deutschpop.",
  party: "Bekannte Tanz- und Partyhits.",
  charts: "Single-Hits ab 2015.",
  "rap-charts": "Hip-Hop-Hits ab 2015.",
  mix: "Zeitraum und Genre selbst wählen.",
  playlist: "Öffentliche Spotify- oder Deezer-Playlist oder eine Titelliste.",
  likes: "Likes, Playlists und Top-Titel des angemeldeten Spotify-Kontos. Passende Titel kommen zusätzlich in die anderen Packs.",
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
    ids: ["likes"],
  },
];

export const VARIANT_IDS: PlayVariant[] = [
  "original",
  "timeline",
  "blind",
  "star",
  "hook",
  "wild",
  "custom",
];

export const VARIANT_LABELS: Record<PlayVariant, string> = {
  original: "Kenner",
  timeline: "Zeitstrahl",
  blind: "Blind",
  star: "Star",
  hook: "Titel",
  wild: "Verrückter",
  custom: "Custom",
};

export const VARIANT_BLURBS: Record<PlayVariant, string> = {
  timeline: "Du hörst den Titel und legst das Jahr. Das Cover darfst du sehen.",
  blind: "Dasselbe, nur ohne Cover bis zum Aufdecken.",
  original: "Interpret und Titel, wenn du sie weißt. Beides richtig: Cover und ein Joker. Standard ohne Joker.",
  star: "Nur den Interpreten, dann legen.",
  hook: "Nur den Titel, dann legen.",
  wild: "Raten, Cover zu, keine Jahreszahlen auf der Linie, links ist später. Die Wiedergabe läuft schneller.",
  custom: "Raten, Cover, Linie, Tempo und Ziel stellst du selbst ein.",
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
  all: "Kein Filter, der ganze Mix.",
  pop: "Pop über die Jahrzehnte.",
  rock: "Rock, Alternative, Classic Rock.",
  rap: "Hip-Hop und Rap.",
  dance: "Dance, Disco, elektronische Hits.",
  soul: "Soul, R&B, Funk.",
  metal: "Metal und härterer Rock.",
  indie: "Indie.",
  latin: "Latin und Reggaeton.",
  schlager: "Schlager und Deutschpop.",
  german: "Deutschsprachige Titel.",
};

export const SUGGEST_IDS: SuggestMode[] = ["on", "off", "loose"];
export const SUGGEST_LABELS: Record<SuggestMode, string> = {
  on: "An",
  off: "Aus",
  loose: "Schwach",
};
export const DEFAULT_SUGGEST: SuggestMode = "on";

export function isSuggestMode(value: unknown): value is SuggestMode {
  return value === "on" || value === "off" || value === "loose";
}

export function parseSuggest(value: unknown): SuggestMode {
  return isSuggestMode(value) ? value : DEFAULT_SUGGEST;
}

export const STAGE_AUDIO_IDS: StageAudio[] = ["stage", "all"];
export const DEFAULT_STAGE_AUDIO: StageAudio = "stage";

export function isStageAudio(value: unknown): value is StageAudio {
  return value === "stage" || value === "all";
}

export function parseStageAudio(value: unknown): StageAudio {
  return isStageAudio(value) ? value : DEFAULT_STAGE_AUDIO;
}

export const NEXT_ROUND_OPTIONS = ["host", "all"] as const;
export const NEXT_ROUND_LABELS: Record<NextRoundPolicy, string> = {
  host: "Nur Host",
  all: "Alle",
};
export const NEXT_ROUND_BLURB: Record<NextRoundPolicy, string> = {
  host: "Nur du als Host startest die nächste Runde. Raum und Stand bleiben.",
  all: "Jede und jeder im Raum darf weiter. Code und Stand bleiben.",
};

export const YEAR_MIN = 1960;
export const YEAR_MAX = new Date().getFullYear();
export const TARGET_MIN = 6;
export const TARGET_MAX = 16;
export const TARGET_STEP = 2;
export const TARGET_OPTIONS = [6, 8, 10, 12, 14, 16] as const;
export const TOKEN_OPTIONS = [0, 1, 2] as const;
export const DEFAULT_TARGET = 10;
export const POOL_MIN = 24;
export const POOL_MAX = 80;
export const POOL_STEP = 4;
export const DEFAULT_POOL = 40;
export const DEFAULT_TOKENS: TokenCount = 2;
export const DEFAULT_VARIANT: PlayVariant = "original";
export const DEFAULT_NEXT_ROUND: NextRoundPolicy = "host";
export const DEFAULT_MIX_FROM = 1980;
export const DEFAULT_MIX_TO = YEAR_MAX;
export const SOLO_LIVES = 3;

export function defaultTokensFor(variant: PlayVariant): TokenCount {
  return variant === "original" ? 0 : DEFAULT_TOKENS;
}

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  era: "all",
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: defaultTokensFor(DEFAULT_VARIANT),
  nextRound: DEFAULT_NEXT_ROUND,
  playlistUrl: "",
  playlistLabel: "",
  mixFrom: DEFAULT_MIX_FROM,
  mixTo: DEFAULT_MIX_TO,
  mixGenre: "all",
  custom: DEFAULT_CUSTOM,
  extraEra: null,
  eras: ["all"],
  pool: DEFAULT_POOL,
  emoji: true,
  chat: true,
  tv: false,
  suggest: DEFAULT_SUGGEST,
  stageAudio: DEFAULT_STAGE_AUDIO,
  cup: false,
  cupSize: "auto",
  cupQualify: 2,
  cupFlow: "seq",
  cupAudio: "stage",
};

export function isPlayVariant(value: unknown): value is PlayVariant {
  return typeof value === "string" && (VARIANT_IDS as string[]).includes(value);
}

export function isTokenCount(value: unknown): value is TokenCount {
  return value === 0 || value === 1 || value === 2;
}

function snapRange(value: unknown, min: number, max: number, step: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const snapped = Math.round((n - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}

export function clampTarget(value: unknown, fallback = DEFAULT_TARGET) {
  return snapRange(value, TARGET_MIN, TARGET_MAX, TARGET_STEP, fallback);
}

export function clampPool(value: unknown, fallback = DEFAULT_POOL) {
  return snapRange(value, POOL_MIN, POOL_MAX, POOL_STEP, fallback);
}

export function isNextRoundPolicy(value: unknown): value is NextRoundPolicy {
  return value === "host" || value === "all";
}

export function isEraId(value: unknown): value is EraId {
  return typeof value === "string" && (ERA_IDS as string[]).includes(value);
}

export function parseExtraEra(value: unknown, era?: EraId): EraId | null {
  if (!isEraId(value) || value === "playlist") return null;
  if (era && value === era) return null;
  return value;
}

export const MAX_PACKS = 4;

export function parseEras(era: unknown, extra?: unknown, list?: unknown): EraId[] {
  const fromList = Array.isArray(list) ? list.filter((id): id is EraId => isEraId(id)) : [];
  const primary = isEraId(era) ? era : "all";
  const second = parseExtraEra(extra, primary);
  const raw = fromList.length > 0 ? fromList : ([primary, second].filter(Boolean) as EraId[]);
  const seen = new Set<EraId>();
  const out: EraId[] = [];
  for (const id of raw) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_PACKS) break;
  }
  if (out[0] === "all") {
    const keep = raw.filter((id) => id === "mix" || id === "playlist" || id === "likes");
    const next: EraId[] = ["all"];
    const seenKeep = new Set<EraId>(["all"]);
    for (const id of keep) {
      if (seenKeep.has(id)) continue;
      seenKeep.add(id);
      next.push(id);
      if (next.length >= MAX_PACKS) break;
    }
    return next;
  }
  return out.length > 0 ? out : ["all"];
}

export function packPatch(eras: EraId[]): Pick<RoomConfig, "era" | "extraEra" | "eras"> {
  const next = parseEras(eras[0], eras[1], eras);
  return { era: next[0] ?? "all", extraEra: next[1] ?? null, eras: next };
}

export function isGenreId(value: unknown): value is GenreId {
  return typeof value === "string" && (GENRE_IDS as string[]).includes(value);
}

export function decadeLabelYear(year: number) {
  if (year >= 2020) return "2020er";
  if (year >= 2010) return "2010er";
  return `${String(year).slice(2)}er`;
}
