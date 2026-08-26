import { create } from "zustand";
import { SPOTIFY_LIVE } from "./flags";

export type SpotifyUser = { name: string; product: string; id: string };

type SpotifyStore = {
  user: SpotifyUser | null;
  ready: boolean;
  libraryCount: number | null;
  hydrate: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
};

export const useSpotify = create<SpotifyStore>((set) => ({
  user: null,
  ready: !SPOTIFY_LIVE,
  libraryCount: null,
  hydrate: async () => {
    if (!SPOTIFY_LIVE) {
      set({ user: null, ready: true, libraryCount: null });
      return;
    }
    try {
      const res = await fetch("/api/spotify");
      const json = (await res.json()) as { user?: SpotifyUser | null; off?: boolean };
      if (json.off) {
        set({ user: null, ready: true, libraryCount: null });
        return;
      }
      const user = json.user ?? null;
      set({ user, ready: true });
      if (!user) {
        set({ libraryCount: null });
        return;
      }
      try {
        const { peekSpotifyLibrary } = await import("./library");
        const peek = await peekSpotifyLibrary();
        set({ libraryCount: peek.count });
      } catch {
        set({ libraryCount: null });
      }
    } catch {
      set({ user: null, ready: true, libraryCount: null });
    }
  },
  login: () => {
    if (!SPOTIFY_LIVE) return;
    window.location.href = "/api/spotify/login";
  },
  logout: async () => {
    if (!SPOTIFY_LIVE) return;
    await fetch("/api/spotify", { method: "POST", body: JSON.stringify({ op: "logout" }) });
    set({ user: null, ready: true, libraryCount: null });
  },
}));

export function spotifyReadyToPlay() {
  return true;
}
