export type SeatRecord = {
  room: string;
  selfId: string;
  role: "host" | "guest";
  name: string;
  tv: boolean;
  adminId: string;
  hostId: string;
  savedAt: number;
};

const KEY = "jahrgang-seat";
const MAX_AGE_MS = 45 * 60 * 1000;

export function makePeerId() {
  return `p-${Math.random().toString(36).slice(2, 10)}`;
}

export function readSeat(room?: string): SeatRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || "null") as SeatRecord | null;
    if (!raw || typeof raw.room !== "string" || typeof raw.selfId !== "string") return null;
    if (raw.role !== "host" && raw.role !== "guest") return null;
    if (Date.now() - raw.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    if (room && raw.room !== room) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeSeat(seat: SeatRecord) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...seat, savedAt: Date.now() }));
  } catch {
    // private mode / quota
  }
}

export function clearSeat() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
