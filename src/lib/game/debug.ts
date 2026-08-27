import { create } from "zustand";

export const DEBUG_WORD = "nadel";

export type DebugPeer = {
  id: string;
  name: string;
  connectionState: string;
  iceConnectionState: string;
  iceGatheringState: string;
  signalingState: string;
  candidateType: string | null;
  rttMs: number | null;
  recoveryAttempts: number;
  terminal: boolean;
  lastProgressAt: number;
  channels: { state: string; reliable: string };
};

export type MeshInspect = {
  selfId: string;
  room: string;
  closed: boolean;
  cursor: number;
  everPolled: boolean;
  ice: string[];
  peers: DebugPeer[];
};

export type DebugLine = {
  at: number;
  dir: "in" | "out" | "note";
  kind: string;
  detail: string;
};

type DebugStore = {
  open: boolean;
  mesh: MeshInspect | null;
  lines: DebugLine[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setMesh: (mesh: MeshInspect | null) => void;
  note: (dir: DebugLine["dir"], kind: string, detail?: string) => void;
};

export const useDebug = create<DebugStore>((set, get) => ({
  open: false,
  mesh: null,
  lines: [],
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
  setMesh: (mesh) => set({ mesh }),
  note: (dir, kind, detail = "") => {
    const line = { at: Date.now(), dir, kind, detail: detail.slice(0, 120) };
    set((state) => ({ lines: [...state.lines.slice(-40), line] }));
  },
}));

export function noteDebug(dir: DebugLine["dir"], kind: string, detail?: string) {
  useDebug.getState().note(dir, kind, detail);
}

let inspectFn: (() => MeshInspect | null) | null = null;

export function bindMeshInspect(fn: (() => MeshInspect | null) | null) {
  inspectFn = fn;
}

export function readMeshInspect() {
  return inspectFn?.() ?? null;
}
