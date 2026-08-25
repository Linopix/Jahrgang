import { create } from "zustand";
import {
  DEFAULT_MIX_FROM,
  DEFAULT_MIX_TO,
  DEFAULT_ROOM_CONFIG,
  DEFAULT_TARGET,
  DEFAULT_TOKENS,
  DEFAULT_VARIANT,
  isEraId,
  isGenreId,
  isPlayVariant,
  isTokenCount,
  type EraId,
  type GenreId,
  type PlayVariant,
  type RoomConfig,
  type TokenCount,
} from "./types";
import { makeRoomCode, normalizeRoomCode } from "./room-code";

export type OnlineStatus = "off" | "entry" | "connecting" | "lobby" | "playing";
export type OnlineRole = "host" | "guest";

export type OnlineMember = {
  id: string;
  name: string;
  connectionState: "self" | "connecting" | "connected" | "failed" | "disconnected";
};

const NAME_KEY = "jahrgang-name";

function readStoredName() {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem(NAME_KEY) ?? "").slice(0, 18);
  } catch {
    return "";
  }
}

function writeStoredName(name: string) {
  if (typeof window === "undefined" || !name) return;
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // private mode / quota
  }
}

type OnlineStore = {
  status: OnlineStatus;
  role: OnlineRole | null;
  roomCode: string;
  selfId: string;
  selfName: string;
  hostId: string;
  members: OnlineMember[];
  era: EraId;
  target: 6 | 8 | 10;
  variant: PlayVariant;
  tokens: TokenCount;
  playlistUrl: string;
  playlistLabel: string;
  mixFrom: number;
  mixTo: number;
  mixGenre: GenreId;
  error: string | null;
  pending: boolean;
  inviteCode: string;
  openEntry: (invite?: string) => void;
  setSelfName: (name: string) => void;
  setInviteCode: (code: string) => void;
  createRoom: () => void;
  joinRoom: (code?: string) => void;
  leaveRoom: () => void;
  setIdentity: (selfId: string, hostIfCreator: boolean) => void;
  setMembers: (members: OnlineMember[]) => void;
  setConfig: (config: RoomConfig) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  markPlaying: () => void;
  markLobby: () => void;
};

export const useOnline = create<OnlineStore>((set, get) => ({
  status: "off",
  role: null,
  roomCode: "",
  selfId: "",
  selfName: "",
  hostId: "",
  members: [],
  era: DEFAULT_ROOM_CONFIG.era,
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: DEFAULT_TOKENS,
  playlistUrl: "",
  playlistLabel: "",
  mixFrom: DEFAULT_MIX_FROM,
  mixTo: DEFAULT_MIX_TO,
  mixGenre: "all",
  error: null,
  pending: false,
  inviteCode: "",

  openEntry: (invite) => {
    const code = invite ? normalizeRoomCode(invite) : get().inviteCode;
    set({
      status: "entry",
      role: null,
      roomCode: "",
      selfId: "",
      hostId: "",
      members: [],
      error: null,
      pending: false,
      inviteCode: code,
      selfName: get().selfName.trim() || readStoredName(),
    });
  },

  setSelfName: (name) => {
    const next = name.slice(0, 18);
    writeStoredName(next.trim());
    set({ selfName: next });
  },
  setInviteCode: (code) => set({ inviteCode: normalizeRoomCode(code) }),

  createRoom: () => {
    const name = get().selfName.trim() || readStoredName() || "Host";
    writeStoredName(name);
    set({
      status: "connecting",
      role: "host",
      roomCode: makeRoomCode(),
      selfName: name,
      hostId: "",
      members: [],
      error: null,
      pending: false,
    });
  },

  joinRoom: (code) => {
    const raw = code ?? get().inviteCode;
    const roomCode = normalizeRoomCode(raw);
    if (roomCode.length < 4) {
      set({ error: "Bitte einen vierstelligen Code oder den Einladungslink eingeben." });
      return;
    }
    const name = get().selfName.trim() || readStoredName() || "Gast";
    writeStoredName(name);
    set({
      status: "connecting",
      role: "guest",
      roomCode,
      selfName: name,
      hostId: "",
      members: [],
      error: null,
      pending: false,
      inviteCode: roomCode,
    });
  },

  leaveRoom: () => {
    set({
      status: "off",
      role: null,
      roomCode: "",
      selfId: "",
      hostId: "",
      members: [],
      error: null,
      pending: false,
    });
  },

  setIdentity: (selfId, hostIfCreator) => {
    const { role, selfName } = get();
    const hostId = hostIfCreator && role === "host" ? selfId : get().hostId;
    set({
      selfId,
      hostId: hostId || get().hostId,
      status: role === "host" ? "lobby" : get().status,
      members:
        role === "host"
          ? [{ id: selfId, name: selfName, connectionState: "self" }]
          : get().members,
    });
  },

  setMembers: (members) => set({ members }),
  setConfig: (config) =>
    set({
      era: isEraId(config.era) ? config.era : DEFAULT_ROOM_CONFIG.era,
      target: config.target,
      variant: isPlayVariant(config.variant) ? config.variant : DEFAULT_VARIANT,
      tokens: isTokenCount(config.tokens) ? config.tokens : DEFAULT_TOKENS,
      playlistUrl: config.playlistUrl ?? "",
      playlistLabel: config.playlistLabel ?? "",
      mixFrom: typeof config.mixFrom === "number" ? config.mixFrom : DEFAULT_MIX_FROM,
      mixTo: typeof config.mixTo === "number" ? config.mixTo : DEFAULT_MIX_TO,
      mixGenre: isGenreId(config.mixGenre) ? config.mixGenre : "all",
    }),
  setError: (error) => set({ error, pending: false }),
  setPending: (pending) => set({ pending }),
  markPlaying: () => set({ status: "playing", pending: false, error: null }),
  markLobby: () => set({ status: "lobby", pending: false }),
}));

export function roomConfigFrom(
  state: Pick<
    OnlineStore,
    | "era"
    | "target"
    | "variant"
    | "tokens"
    | "playlistUrl"
    | "playlistLabel"
    | "mixFrom"
    | "mixTo"
    | "mixGenre"
  >,
): RoomConfig {
  return {
    era: state.era,
    target: state.target,
    variant: state.variant,
    tokens: state.tokens,
    playlistUrl: state.playlistUrl,
    playlistLabel: state.playlistLabel,
    mixFrom: state.mixFrom,
    mixTo: state.mixTo,
    mixGenre: state.mixGenre,
  };
}

export function isMyTurn(selfId: string, currentPlayerId: string | undefined) {
  if (!selfId || !currentPlayerId) return true;
  return selfId === currentPlayerId;
}
