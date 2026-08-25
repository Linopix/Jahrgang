import { create } from "zustand";
import { songsForPack } from "./packs";
import { canPlace, decadeLabel, fisherYates, insertSong, winner } from "./engine";
import { scoreGuesses } from "./guess";
import { loadPlaylistSongs, type PlaylistTrack } from "./playlist";
import { resolvePreviews } from "./preview";
import {
  pausePreview,
  playPreview,
  sfxCorrect,
  sfxPlace,
  sfxWin,
  sfxWrong,
  stopPreview,
  unlockAudio,
} from "./audio";
import {
  DEFAULT_MIX_FROM,
  DEFAULT_MIX_TO,
  DEFAULT_TARGET,
  DEFAULT_TOKENS,
  DEFAULT_VARIANT,
  SOLO_LIVES,
  type CatalogSong,
  type EraId,
  type GameMode,
  type GameSnapshot,
  type LastResult,
  type Phase,
  type PlayVariant,
  type Player,
  type ResolvedSong,
  type SetupConfig,
  type TokenCount,
} from "./types";

const POOL_SIZE = 40;

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
  useDecade: () => void;
  useSkip: () => void;
  replay: () => void;
  snapshot: () => GameSnapshot;
  applySnapshot: (snap: GameSnapshot) => void;
  resetBoard: () => void;
};

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

function hydratePlayers(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    tokens: player.tokens ?? 0,
    misses: player.misses ?? 0,
    quiz: player.quiz ?? 0,
  }));
}

function isOver(players: Player[], target: number, mode: GameMode) {
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
      players: s.players,
      currentPlayerIndex: s.currentPlayerIndex,
      deck: s.deck,
      current: s.current,
      lastResult: s.lastResult,
      decadeHint: s.decadeHint,
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
      players: hydratePlayers(snap.players),
      currentPlayerIndex: snap.currentPlayerIndex,
      deck: snap.deck,
      current: snap.current,
      lastResult: snap.lastResult,
      decadeHint: snap.decadeHint,
      selectedSlot:
        prev.phase === snap.phase && prev.current?.id === snap.current?.id
          ? prev.selectedSlot
          : null,
      loadError: null,
    });
    if (snap.phase === "listen" && snap.current && songChanged) {
      void playPreview(snap.current.previewUrl);
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
    const variant = config.variant ?? DEFAULT_VARIANT;
    const tokens = config.tokens ?? DEFAULT_TOKENS;
    set({
      phase: "loading",
      mode: config.mode,
      era: config.era,
      target: config.target,
      variant,
      lastSetup: config,
      loadProgress: { done: 0, total: POOL_SIZE },
      loadError: null,
    });
    try {
      const names =
        config.mode === "solo"
          ? [config.names[0]?.trim() || "Du"]
          : config.names.filter((name) => name.trim()).slice(0, 8);
      const playerCount = Math.max(1, names.length);
      const seats = names.map((name, i) => ({
        id: config.ids?.[i] ?? `p-${i}`,
        name,
      }));
      const needed = Math.min(
        POOL_SIZE,
        playerCount + Math.max(config.target + 4, 10),
      );
      let imported: PlaylistTrack[] = [];
      if (config.era === "playlist" && !config.playlistUrl) {
        set({
          phase: "setup",
          loadError: "Bitte einen öffentlichen Spotify- oder Deezer-Link übernehmen.",
        });
        return false;
      }
      if (config.era === "playlist" && config.playlistUrl) {
        try {
          imported = await loadPlaylistSongs({ data: { url: config.playlistUrl } });
        } catch {
          imported = [];
        }
      }
      const catalogPool = fisherYates(
        songsForPack(config.era === "playlist" ? "all" : config.era, {
          from: config.mixFrom ?? DEFAULT_MIX_FROM,
          to: config.mixTo ?? DEFAULT_MIX_TO,
          genre: config.mixGenre ?? "all",
        }),
      );
      const pool: Array<CatalogSong | PlaylistTrack> = imported.length
        ? [...fisherYates(imported), ...catalogPool]
        : catalogPool;
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
          if (!result.previewUrl) continue;
          const song = slice.find((row) => row.id === result.id);
          if (!song) continue;
          resolved.push({
            ...song,
            year: song.year || result.year || song.year,
            previewUrl: result.previewUrl,
            artworkUrl: result.artworkUrl ?? undefined,
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
      set({
        players,
        deck: deck.slice(1),
        current,
        currentPlayerIndex: 0,
        selectedSlot: null,
        lastResult: null,
        decadeHint: null,
        phase: "listen",
        loadProgress: { done: resolved.length, total: resolved.length },
      });
      if (current) void playPreview(current.previewUrl);
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
    const { phase, current, selectedSlot, players, currentPlayerIndex, variant } = get();
    if (phase !== "listen" || !current || selectedSlot === null) return;
    const player = players[currentPlayerIndex];
    if (!player) return;
    pausePreview();
    const correct = canPlace(player.timeline, selectedSlot, current.year);
    const scored =
      variant === "original"
        ? scoreGuesses(guess?.title ?? "", guess?.artist ?? "", current)
        : null;
    const nextPlayers = players.map((row, i) => {
      if (i !== currentPlayerIndex) return row;
      const quiz = row.quiz + (scored?.quiz ?? 0);
      if (correct) {
        return { ...row, timeline: insertSong(row.timeline, selectedSlot, current), quiz };
      }
      return { ...row, misses: row.misses + 1, quiz };
    });
    if (correct) sfxCorrect();
    else sfxWrong();
    set({
      players: nextPlayers,
      lastResult: {
        correct,
        song: current,
        slot: selectedSlot,
        titleGuess: variant === "original" ? guess?.title ?? "" : undefined,
        artistGuess: variant === "original" ? guess?.artist ?? "" : undefined,
        titleCorrect: scored?.titleCorrect,
        artistCorrect: scored?.artistCorrect,
      },
      phase: "reveal",
      selectedSlot: null,
      decadeHint: null,
    });
  },

  nextTurn: (opts) => {
    const { phase, players, currentPlayerIndex, deck, mode, target, lastResult } = get();
    if (phase !== "reveal") return;
    stopPreview();
    if (isOver(players, target, mode) || deck.length === 0) {
      if (lastResult?.correct && winner(players, target)) sfxWin();
      set({ phase: "winner", current: null });
      return;
    }
    const nextIndex = pickNextIndex(players, currentPlayerIndex, mode, opts?.skipIds);
    const current = deck[0] ?? null;
    set({
      currentPlayerIndex: nextIndex,
      deck: deck.slice(1),
      current,
      lastResult: null,
      selectedSlot: null,
      decadeHint: null,
      phase: "listen",
    });
    if (current) void playPreview(current.previewUrl);
  },

  useDecade: () => {
    const { current, players, currentPlayerIndex, decadeHint, phase } = get();
    if (phase !== "listen" || !current || decadeHint) return;
    const player = players[currentPlayerIndex];
    if (!player || player.tokens <= 0) return;
    set({
      decadeHint: decadeLabel(current.year),
      players: players.map((row, i) =>
        i === currentPlayerIndex ? { ...row, tokens: row.tokens - 1 } : row,
      ),
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
    const rest = deck.slice(1);
    set({
      players: players.map((row, i) =>
        i === currentPlayerIndex ? { ...row, tokens: row.tokens - 1 } : row,
      ),
      current: next,
      deck: [...rest, leftover],
      selectedSlot: null,
      decadeHint: null,
    });
    void playPreview(next.previewUrl);
  },

  replay: () => {
    const { current, phase } = get();
    if (!current || phase !== "listen") return;
    void playPreview(current.previewUrl);
  },
}));

export function currentPlayer(state: Pick<GameStore, "players" | "currentPlayerIndex">) {
  return state.players[state.currentPlayerIndex] ?? null;
}
