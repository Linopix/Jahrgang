import { create } from "zustand";
import { DEFAULT_TARGET, type EraId } from "./types";
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
  setConfig: (era: EraId, target: 6 | 8 | 10) => void;
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
  era: "all",
  target: DEFAULT_TARGET,
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
  setConfig: (era, target) => set({ era, target }),
  setError: (error) => set({ error, pending: false }),
  setPending: (pending) => set({ pending }),
  markPlaying: () => set({ status: "playing", pending: false, error: null }),
  markLobby: () => set({ status: "lobby", pending: false }),
}));

export function isMyTurn(selfId: string, currentPlayerId: string | undefined) {
  if (!selfId || !currentPlayerId) return true;
  return selfId === currentPlayerId;
}
