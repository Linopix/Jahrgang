import { create } from "zustand";
import { songsForEra } from "./catalog";
import { canPlace, decadeLabel, fisherYates, insertSong, winner } from "./engine";
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
  DEFAULT_TARGET,
  SOLO_LIVES,
  STARTING_TOKENS,
  type EraId,
  type GameMode,
  type LastResult,
  type Phase,
  type Player,
  type ResolvedSong,
  type SetupConfig,
} from "./types";

const POOL_SIZE = 40;

type GameStore = {
  phase: Phase;
  mode: GameMode;
  era: EraId;
  target: number;
  players: Player[];
  currentPlayerIndex: number;
  deck: ResolvedSong[];
  current: ResolvedSong | null;
  selectedSlot: number | null;
  lastResult: LastResult | null;
  decadeHint: string | null;
  loadProgress: { done: number; total: number };
  loadError: string | null;
  rulesOpen: boolean;
  volume: number;
  muted: boolean;
  openSetup: (mode: GameMode) => void;
  openHome: () => void;
  setRulesOpen: (open: boolean) => void;
  startGame: (config: SetupConfig) => Promise<void>;
  selectSlot: (index: number) => void;
  confirmPlacement: () => void;
  nextTurn: () => void;
  useDecade: () => void;
  useSkip: () => void;
  replay: () => void;
};

function makePlayers(names: string[], starters: ResolvedSong[]): Player[] {
  return names.map((name, i) => ({
    id: `p-${i}`,
    name: name.trim() || `Spieler ${i + 1}`,
    timeline: starters[i] ? [starters[i]] : [],
    tokens: STARTING_TOKENS,
    misses: 0,
  }));
}

function isOver(players: Player[], target: number, mode: GameMode) {
  if (winner(players, target)) return true;
  if (mode === "solo" && (players[0]?.misses ?? 0) >= SOLO_LIVES) return true;
  return false;
}

export const useGame = create<GameStore>((set, get) => ({
  phase: "home",
  mode: "party",
  era: "all",
  target: DEFAULT_TARGET,
  players: [],
  currentPlayerIndex: 0,
  deck: [],
  current: null,
  selectedSlot: null,
  lastResult: null,
  decadeHint: null,
  loadProgress: { done: 0, total: 1 },
  loadError: null,
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

  setRulesOpen: (open) => set({ rulesOpen: open }),

  startGame: async (config) => {
    unlockAudio();
    set({
      phase: "loading",
      mode: config.mode,
      era: config.era,
      target: config.target,
      loadProgress: { done: 0, total: POOL_SIZE },
      loadError: null,
    });
    try {
      const names =
        config.mode === "solo"
          ? [config.names[0]?.trim() || "Du"]
          : config.names.filter((name) => name.trim()).slice(0, 8);
      const playerCount = Math.max(1, names.length);
      const needed = Math.min(
        POOL_SIZE,
        playerCount + Math.max(config.target + 4, 10),
      );
      const pool = fisherYates(songsForEra(config.era));
      const resolved: ResolvedSong[] = [];
      const seen = new Set<string>();
      set({ loadProgress: { done: 0, total: needed } });

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
            previewUrl: result.previewUrl,
            artworkUrl: result.artworkUrl ?? undefined,
          });
        }
        set({ loadProgress: { done: Math.min(resolved.length, needed), total: needed } });
      }

      if (resolved.length < playerCount + 4) {
        set({
          phase: "setup",
          loadError:
            "Zu wenige Songs mit Vorschau gefunden. Anderes Repertoire wählen oder später nochmal versuchen.",
        });
        return;
      }

      const starters = resolved.slice(0, playerCount);
      const deck = resolved.slice(playerCount);
      const players = makePlayers(names, starters);
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
    } catch {
      set({
        phase: "setup",
        loadError: "Vorschauen konnten nicht geladen werden. Verbindung prüfen und erneut starten.",
      });
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

  confirmPlacement: () => {
    const { phase, current, selectedSlot, players, currentPlayerIndex } = get();
    if (phase !== "listen" || !current || selectedSlot === null) return;
    const player = players[currentPlayerIndex];
    if (!player) return;
    pausePreview();
    const correct = canPlace(player.timeline, selectedSlot, current.year);
    const nextPlayers = players.map((row, i) => {
      if (i !== currentPlayerIndex) return row;
      if (correct) {
        return { ...row, timeline: insertSong(row.timeline, selectedSlot, current) };
      }
      return { ...row, misses: row.misses + 1 };
    });
    if (correct) sfxCorrect();
    else sfxWrong();
    set({
      players: nextPlayers,
      lastResult: { correct, song: current, slot: selectedSlot },
      phase: "reveal",
      selectedSlot: null,
      decadeHint: null,
    });
  },

  nextTurn: () => {
    const { phase, players, currentPlayerIndex, deck, mode, target, lastResult } = get();
    if (phase !== "reveal") return;
    stopPreview();
    if (isOver(players, target, mode) || deck.length === 0) {
      if (lastResult?.correct && winner(players, target)) sfxWin();
      set({ phase: "winner", current: null });
      return;
    }
    const nextIndex = mode === "solo" ? 0 : (currentPlayerIndex + 1) % players.length;
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
