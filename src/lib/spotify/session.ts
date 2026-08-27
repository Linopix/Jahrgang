import { create } from "zustand";
import { SPOTIFY_LIVE } from "./flags";
import type { CatalogSong } from "@/lib/game/types";

export type SpotifyUser = { name: string; product: string; id: string };

const REFRESH_MS = 15 * 60 * 1000;

type SpotifyStore = {
  user: SpotifyUser | null;
  ready: boolean;
  libraryCount: number | null;
  library: CatalogSong[];
  hydrate: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
};

let refreshTimer: number | null = null;

function armRefresh(hydrate: () => Promise<void>) {
  if (typeof window === "undefined") return;
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    void hydrate();
  }, REFRESH_MS);
}

export const useSpotify = create<SpotifyStore>((set, get) => ({
  user: null,
  ready: !SPOTIFY_LIVE,
  libraryCount: null,
  library: [],
  hydrate: async () => {
    if (!SPOTIFY_LIVE) {
      set({ user: null, ready: true, libraryCount: null, library: [] });
      return;
    }
    try {
      const res = await fetch("/api/spotify");
      const json = (await res.json()) as { user?: SpotifyUser | null; off?: boolean };
      if (json.off) {
        set({ user: null, ready: true, libraryCount: null, library: [] });
        return;
      }
      const user = json.user ?? null;
      if (!user) {
        set({ user: null, ready: true, libraryCount: null, library: [] });
        return;
      }
      set({ user, ready: true });
      try {
        const { peekSpotifyLibrary } = await import("./library");
        const peek = await peekSpotifyLibrary();
        set({ libraryCount: peek.count, library: peek.songs });
      } catch {
        set({ libraryCount: null, library: [] });
      }
      armRefresh(get().hydrate);
    } catch {
      set({ user: null, ready: true, libraryCount: null, library: [] });
    }
  },
  login: () => {
    if (!SPOTIFY_LIVE) return;
    window.location.href = "/api/spotify/login";
  },
  logout: async () => {
    if (!SPOTIFY_LIVE) return;
    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = null;
    await fetch("/api/spotify", { method: "POST", body: JSON.stringify({ op: "logout" }) });
    set({ user: null, ready: true, libraryCount: null, library: [] });
  },
}));

export function spotifyReadyToPlay() {
  return true;
}
