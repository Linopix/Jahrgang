import { create } from "zustand";
import { songsForEras } from "./packs";
import { canPlace, dealCount, decadeLabel, fisherYates, insertSong, mergeSeries, tallySeries, winner } from "./engine";
import { kennerBonus, scoreForVariant } from "./guess";
import { loadPlaylistSongs, type PlaylistTrack } from "./playlist";
import { loadSpotifyLibrary } from "@/lib/spotify/library";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { mergeExtraSongsFor } from "./extras";
import { getFreshSongs } from "./fresh";
import { resolvePreviews } from "./preview";
import {
  pausePreview,
  playPreview,
  previewRate,
  sfxCorrect,
  sfxHint,
  sfxPlace,
  sfxSkip,
  sfxVinylStart,
  sfxWin,
  sfxWrong,
  stopPreview,
  unlockAudio,
} from "./audio";
import { canPlayCue } from "@/lib/tv/mode";
import { safeName } from "./moderation";
import {
  DEFAULT_CUSTOM,
  DEFAULT_MIX_FROM,
  DEFAULT_MIX_TO,
  DEFAULT_POOL,
  DEFAULT_TARGET,
  DEFAULT_VARIANT,
  POOL_MAX,
  SOLO_LIVES,
  clampPool,
  clampTarget,
  defaultTokensFor,
  emptyStats,
  parseCustom,
  parseEras,
  rulesFor,
  type CatalogSong,
  type CustomRules,
  type EraId,
  type GameMode,
  type GameSnapshot,
  type LastResult,
  type Phase,
  type PlayVariant,
  type Player,
  type ResolvedSong,
  type SeriesStanding,
  type SessionStats,
  type SetupConfig,
  type TokenCount,
} from "./types";

const POOL_SIZE = 80;

export type SongGuess = {
  title: string;
  artist: string;
};

type GameStore = {
  phase: Phase;
  mode: GameMode;
  era: EraId;
  target: number;
  variant: PlayVariant;
  custom: CustomRules;
  players: Player[];
  currentPlayerIndex: number;
  deck: ResolvedSong[];
  current: ResolvedSong | null;
  selectedSlot: number | null;
  lastResult: LastResult | null;
  decadeHint: string | null;
  loadProgress: { done: number; total: number };
  loadError: string | null;
  lastSetup: SetupConfig | null;
  series: SeriesStanding[];
  stats: SessionStats;
  roundStats: SessionStats;
  rulesOpen: boolean;
  volume: number;
  muted: boolean;
  openSetup: (mode: GameMode) => void;
  openHome: () => void;
  setRulesOpen: (open: boolean) => void;
  startGame: (config: SetupConfig) => Promise<boolean>;
  selectSlot: (index: number) => void;
  confirmPlacement: (guess?: SongGuess) => void;
  nextTurn: (opts?: { skipIds?: string[] }) => void;
  endGame: () => void;
  useDecade: () => void;
  useSkip: () => void;
  replay: () => void;
  snapshot: () => GameSnapshot;
  applySnapshot: (snap: GameSnapshot) => void;
  resetBoard: () => void;
};

function cuePreview(song: ResolvedSong | null, variant: PlayVariant, custom?: CustomRules) {
  if (!song) return;
  if (!canPlayCue()) return;
  void playPreview(song.previewUrl, previewRate(rulesFor(variant, custom).warp, song.id), song.spotifyUri);
}

function makePlayers(
  seats: { id: string; name: string }[],
  starters: ResolvedSong[],
  tokens: TokenCount,
): Player[] {
  return seats.map((seat, i) => ({
    id: seat.id,
    name: seat.name.trim() || `Spieler ${i + 1}`,
    timeline: starters[i] ? [starters[i]] : [],
    tokens,
    misses: 0,
    quiz: 0,
  }));
}

function bumpStats(stats: SessionStats, patch: Partial<Omit<SessionStats, "startedAt">>): SessionStats {
  return {
    startedAt: stats.startedAt,
    heard: stats.heard + (patch.heard ?? 0),
    placedOk: stats.placedOk + (patch.placedOk ?? 0),
    placedBad: stats.placedBad + (patch.placedBad ?? 0),
    quizHits: stats.quizHits + (patch.quizHits ?? 0),
    quizAsked: stats.quizAsked + (patch.quizAsked ?? 0),
    skips: stats.skips + (patch.skips ?? 0),
    hints: stats.hints + (patch.hints ?? 0),
  };
}

function hydratePlayers(players: Player[]): Player[] {
  return players.map((player, i) => ({
    ...player,
    name: safeName(player.name, `Spieler ${i + 1}`),
    tokens: player.tokens ?? 0,
    misses: player.misses ?? 0,
    quiz: player.quiz ?? 0,
  }));
}

function isOver(players: Player[], target: number, mode: GameMode, variant: PlayVariant, custom?: CustomRules) {
  if (rulesFor(variant, custom).open) return false;
  if (winner(players, target)) return true;
  if (mode === "solo" && (players[0]?.misses ?? 0) >= SOLO_LIVES) return true;
  return false;
}

function pickNextIndex(
  players: Player[],
  currentPlayerIndex: number,
  mode: GameMode,
  skipIds?: string[],
) {
  if (mode === "solo") return 0;
  const blocked = new Set(skipIds ?? []);
  for (let n = 1; n <= players.length; n += 1) {
    const idx = (currentPlayerIndex + n) % players.length;
    const row = players[idx];
    if (row && !blocked.has(row.id)) return idx;
  }
  return (currentPlayerIndex + 1) % players.length;
}

export const useGame = create<GameStore>((set, get) => ({
  phase: "home",
  mode: "party",
  era: "all",
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  custom: DEFAULT_CUSTOM,
  players: [],
  currentPlayerIndex: 0,
  deck: [],
  current: null,
  selectedSlot: null,
  lastResult: null,
  decadeHint: null,
  loadProgress: { done: 0, total: 1 },
  loadError: null,
  lastSetup: null,
  series: [],
  stats: emptyStats(0),
  roundStats: emptyStats(0),
  rulesOpen: false,
  volume: 0.85,
  muted: false,

  openSetup: (mode) => {
    stopPreview();
    set({
      phase: "setup",
      mode,
      loadError: null,
      current: null,
      lastResult: null,
    });
  },

  openHome: () => {
    stopPreview();
    set({
      phase: "home",
      players: [],
      deck: [],
      current: null,
      lastResult: null,
      selectedSlot: null,
      decadeHint: null,
      loadError: null,
      series: [],
      stats: emptyStats(0),
      roundStats: emptyStats(0),
    });
  },

  resetBoard: () => {
    stopPreview();
    set({
      phase: "home",
      players: [],
      deck: [],
      current: null,
      lastResult: null,
      selectedSlot: null,
      decadeHint: null,
      loadError: null,
    });
  },

  setRulesOpen: (open) => set({ rulesOpen: open }),

  snapshot: () => {
    const s = get();
    return {
      phase: s.phase,
      mode: s.mode,
      era: s.era,
      target: s.target,
      variant: s.variant,
      custom: s.custom,
      players: s.players,
      currentPlayerIndex: s.currentPlayerIndex,
      deck: s.deck,
      current: s.current,
      lastResult: s.lastResult,
      decadeHint: s.decadeHint,
      series: s.series,
      stats: s.stats,
      roundStats: s.roundStats,
    };
  },

  applySnapshot: (snap) => {
    const prev = get();
    const songChanged =
      prev.current?.id !== snap.current?.id || prev.phase !== snap.phase;
    set({
      phase: snap.phase,
      mode: snap.mode,
      era: snap.era,
      target: snap.target,
      variant: snap.variant ?? DEFAULT_VARIANT,
      custom: parseCustom(snap.custom),
      players: hydratePlayers(snap.players),
      currentPlayerIndex: snap.currentPlayerIndex,
      deck: snap.deck,
      current: snap.current,
      lastResult: snap.lastResult,
      decadeHint: snap.decadeHint,
      series: snap.series ?? prev.series,
      stats: snap.stats ?? prev.stats,
      roundStats: snap.roundStats ?? prev.roundStats,
      selectedSlot:
        prev.phase === snap.phase && prev.current?.id === snap.current?.id
          ? prev.selectedSlot
          : null,
      loadError: null,
    });
    if (snap.phase === "listen" && snap.current && songChanged) {
      cuePreview(snap.current, snap.variant ?? DEFAULT_VARIANT, parseCustom(snap.custom));
    }
    if (snap.phase === "reveal" && prev.phase !== "reveal") {
      pausePreview();
      if (snap.lastResult?.correct) sfxCorrect();
      else sfxWrong();
    }
    if (snap.phase === "winner" && prev.phase !== "winner") {
      stopPreview();
      if (snap.lastResult?.correct) sfxWin();
    }
    if (snap.phase === "loading" && prev.phase !== "loading") {
      stopPreview();
    }
  },

  startGame: async (config) => {
    unlockAudio();
    sfxVinylStart();
    const variant = config.variant ?? DEFAULT_VARIANT;
    const custom = parseCustom(config.custom);
    const tokens = config.tokens ?? defaultTokensFor(variant);
    set({
      phase: "loading",
      mode: config.mode,
      era: config.era,
      target: clampTarget(config.target),
      variant,
      custom,
      lastSetup: config,
      loadProgress: { done: 0, total: POOL_SIZE },
      loadError: null,
    });
    try {
      const names =
        config.mode === "solo"
          ? [safeName(config.names[0] || "", "Du")]
          : config.names
              .map((name) => name.trim())
              .filter(Boolean)
              .map((name, i) => safeName(name, `Spieler ${i + 1}`))
              .slice(0, 8);
      const playerCount = Math.max(1, names.length);
      const seats = names.map((name, i) => ({
        id: config.ids?.[i] ?? `p-${i}`,
        name,
      }));
      const rules = rulesFor(variant, custom);
      const wanted = variant === "custom" ? clampPool(config.pool, DEFAULT_POOL) : undefined;
      const needed = dealCount(playerCount, clampTarget(config.target), rules.open, wanted, POOL_MAX);
      const packs = parseEras(config.era, config.extraEra, config.eras);
      let imported: PlaylistTrack[] = [];
      if (packs.includes("playlist") && !config.playlistUrl) {
        set({
          phase: "setup",
          loadError: "Bitte einen öffentlichen Spotify- oder Deezer-Link übernehmen.",
        });
        return false;
      }
      if (packs.includes("playlist") && config.playlistUrl) {
        try {
          imported = await loadPlaylistSongs({ data: { url: config.playlistUrl } });
        } catch {
          imported = [];
        }
      }
      let library: PlaylistTrack[] = [];
      if (SPOTIFY_LIVE && useSpotify.getState().user) {
        try {
          library = await loadSpotifyLibrary();
        } catch {
          library = [];
        }
      }
      if (packs.includes("likes") && imported.length === 0 && library.length === 0) {
        set({
          phase: "setup",
          loadError: "Bei Spotify anmelden, dann liegen deine Titel bereit. Oder ein anderes Pack wählen.",
        });
        return false;
      }
      const mix = {
        from: config.mixFrom ?? DEFAULT_MIX_FROM,
        to: config.mixTo ?? DEFAULT_MIX_TO,
        genre: config.mixGenre ?? "all",
      };
      const catalogPool = fisherYates(songsForEras(packs, mix));
      const extras = fisherYates([...imported, ...library, ...getFreshSongs()]);
      const merged = mergeExtraSongsFor(catalogPool, extras, packs, mix);
      const pool: Array<CatalogSong | PlaylistTrack> = merged.pool;
      const resolved: ResolvedSong[] = [];
      const seen = new Set<string>();
      set({ loadProgress: { done: 0, total: needed } });

      for (const song of pool) {
        if (resolved.length >= needed) break;
        if (seen.has(song.id)) continue;
        const ready = "previewUrl" in song ? song.previewUrl : undefined;
        if (ready) {
          seen.add(song.id);
          resolved.push({
            ...song,
            previewUrl: ready,
            artworkUrl: "artworkUrl" in song ? song.artworkUrl : undefined,
          });
          set({ loadProgress: { done: Math.min(resolved.length, needed), total: needed } });
        }
      }

      for (let i = 0; i < pool.length && resolved.length < needed; i += 8) {
        const slice = pool.slice(i, i + 8).filter((song) => !seen.has(song.id));
        slice.forEach((song) => seen.add(song.id));
        if (slice.length === 0) continue;
        const results = await resolvePreviews({ data: { queries: slice } });
        for (const result of results) {
          if (!result.previewUrl && !result.spotifyUri) continue;
          const song = slice.find((row) => row.id === result.id);
          if (!song) continue;
          resolved.push({
            ...song,
            year: song.year || result.year || song.year,
            previewUrl: result.previewUrl || "",
            artworkUrl: result.artworkUrl ?? undefined,
            spotifyUri: result.spotifyUri,
          });
        }
        set({ loadProgress: { done: Math.min(resolved.length, needed), total: needed } });
      }

      if (resolved.length < playerCount + 4) {
        set({
          phase: "setup",
          loadError: config.playlistUrl
            ? "Zu wenige Titel mit Jahr und Vorschau. Playlist öffentlich teilen oder Repertoire nutzen."
            : "Zu wenige Songs mit Vorschau gefunden. Anderes Repertoire wählen oder später nochmal versuchen.",
        });
        return false;
      }

      const starters = resolved.slice(0, playerCount);
      const deck = resolved.slice(playerCount);
      const players = makePlayers(seats, starters, tokens);
      const current = deck[0] ?? null;
      const now = Date.now();
      const keepSession = get().series.some((row) => row.wins > 0 || row.points > 0);
      set({
        players,
        deck: deck.slice(1),
        current,
        currentPlayerIndex: 0,
        selectedSlot: null,
        lastResult: null,
        decadeHint: null,
        series: mergeSeries(get().series, seats),
        roundStats: emptyStats(now),
        stats: keepSession ? get().stats : emptyStats(now),
        phase: "listen",
        loadProgress: { done: resolved.length, total: resolved.length },
      });
      cuePreview(current, variant, custom);
      return true;
    } catch {
      set({
        phase: "setup",
        loadError: "Vorschauen konnten nicht geladen werden. Verbindung prüfen und erneut starten.",
      });
      return false;
    }
  },

  selectSlot: (index) => {
    const { phase, current, players, currentPlayerIndex } = get();
    if (phase !== "listen" || !current) return;
    const player = players[currentPlayerIndex];
    if (!player) return;
    if (index < 0 || index > player.timeline.length) return;
    sfxPlace();
    set({ selectedSlot: index });
  },

  confirmPlacement: (guess) => {
    const { phase, current, selectedSlot, players, currentPlayerIndex, variant, custom } = get();
    if (phase !== "listen" || !current || selectedSlot === null) return;
    const player = players[currentPlayerIndex];
    if (!player) return;
    pausePreview();
    const rules = rulesFor(variant, custom);
    const correct =
      rules.free ||
      canPlace(player.timeline, selectedSlot, current.year, rules.reverse);
    const scored =
      rules.guess === "none"
        ? null
        : scoreForVariant(guess?.title ?? "", guess?.artist ?? "", current, variant, custom);
    const titleFilled = Boolean(guess?.title?.trim());
    const artistFilled = Boolean(guess?.artist?.trim());
    const kind = rules.guess;
    const asked =
      kind === "none"
        ? 0
        : kind === "both"
          ? Number(titleFilled) + Number(artistFilled)
          : kind === "title"
            ? Number(titleFilled)
            : Number(artistFilled);
    const earned = Boolean(scored && kennerBonus(variant, scored.titleCorrect, scored.artistCorrect));
    const nextPlayers = players.map((row, i) => {
      if (i !== currentPlayerIndex) return row;
      const quiz = row.quiz + (scored?.quiz ?? 0);
      const tokens = row.tokens + (earned ? 1 : 0);
      if (correct) {
        return { ...row, timeline: insertSong(row.timeline, selectedSlot, current), quiz, tokens };
      }
      return { ...row, misses: row.misses + 1, quiz, tokens };
    });
    if (correct) sfxCorrect();
    else sfxWrong();
    if (earned) sfxHint();
    const patch = {
      heard: 1,
      placedOk: correct ? 1 : 0,
      placedBad: correct ? 0 : 1,
      quizHits: scored?.quiz ?? 0,
      quizAsked: asked,
    };
    set({
      players: nextPlayers,
      lastResult: {
        correct,
        song: current,
        slot: selectedSlot,
        titleGuess: kind === "both" || kind === "title" ? guess?.title ?? "" : undefined,
        artistGuess: kind === "both" || kind === "artist" ? guess?.artist ?? "" : undefined,
        titleCorrect: scored?.titleCorrect,
        artistCorrect: scored?.artistCorrect,
        jokerEarned: earned,
      },
      phase: "reveal",
      selectedSlot: null,
      decadeHint: null,
      stats: bumpStats(get().stats, patch),
      roundStats: bumpStats(get().roundStats, patch),
    });
  },

  nextTurn: (opts) => {
    const { phase, players, currentPlayerIndex, deck, mode, target, lastResult, series, variant, custom } = get();
    if (phase !== "reveal") return;
    stopPreview();
    const open = rulesFor(variant, custom).open;
    if (isOver(players, target, mode, variant, custom)) {
      if (lastResult?.correct && winner(players, target)) sfxWin();
      set({
        phase: "winner",
        current: null,
        series: tallySeries(series, players, target),
      });
      return;
    }
    const pile =
      lastResult && !lastResult.correct && !open
        ? [...deck, lastResult.song]
        : deck;
    if (pile.length === 0) {
      sfxWin();
      set({
        phase: "winner",
        current: null,
        series: tallySeries(series, players, target),
      });
      return;
    }
    const nextIndex = pickNextIndex(players, currentPlayerIndex, mode, opts?.skipIds);
    const current = pile[0] ?? null;
    set({
      currentPlayerIndex: nextIndex,
      deck: pile.slice(1),
      current,
      lastResult: null,
      selectedSlot: null,
      decadeHint: null,
      phase: "listen",
    });
    if (current) cuePreview(current, get().variant, get().custom);
  },

  endGame: () => {
    const { phase, players, series, target } = get();
    if (phase !== "listen" && phase !== "reveal") return;
    stopPreview();
    sfxWin();
    set({
      phase: "winner",
      current: null,
      lastResult: null,
      selectedSlot: null,
      decadeHint: null,
      series: tallySeries(series, players, target),
    });
  },

  useDecade: () => {
    const { current, players, currentPlayerIndex, decadeHint, phase } = get();
    if (phase !== "listen" || !current || decadeHint) return;
    const player = players[currentPlayerIndex];
    if (!player || player.tokens <= 0) return;
    sfxHint();
    set({
      decadeHint: decadeLabel(current.year),
      players: players.map((row, i) =>
        i === currentPlayerIndex ? { ...row, tokens: row.tokens - 1 } : row,
      ),
      stats: bumpStats(get().stats, { hints: 1 }),
      roundStats: bumpStats(get().roundStats, { hints: 1 }),
    });
  },

  useSkip: () => {
    const { phase, players, currentPlayerIndex, deck, current } = get();
    if (phase !== "listen" || !current || deck.length === 0) return;
    const player = players[currentPlayerIndex];
    if (!player || player.tokens <= 0) return;
    stopPreview();
    const leftover = current;
    const next = deck[0];
    if (!next) return;
    sfxSkip();
    const rest = deck.slice(1);
    const skipPatch = { heard: 1, skips: 1 };
    set({
      players: players.map((row, i) =>
        i === currentPlayerIndex ? { ...row, tokens: row.tokens - 1 } : row,
      ),
      current: next,
      deck: [...rest, leftover],
      selectedSlot: null,
      decadeHint: null,
      stats: bumpStats(get().stats, skipPatch),
      roundStats: bumpStats(get().roundStats, skipPatch),
    });
    cuePreview(next, get().variant, get().custom);
  },

  replay: () => {
    const { current, phase, variant, custom } = get();
    if (!current || phase !== "listen") return;
    cuePreview(current, variant, custom);
  },
}));

export function currentPlayer(state: Pick<GameStore, "players" | "currentPlayerIndex">) {
  return state.players[state.currentPlayerIndex] ?? null;
}
