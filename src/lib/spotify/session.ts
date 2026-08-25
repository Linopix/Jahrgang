import { create } from "zustand";
import { SPOTIFY_LIVE } from "./flags";

export type SpotifyUser = { name: string; product: string; id: string };

type SpotifyStore = {
  user: SpotifyUser | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
};

export const useSpotify = create<SpotifyStore>((set) => ({
  user: null,
  ready: !SPOTIFY_LIVE,
  hydrate: async () => {
    if (!SPOTIFY_LIVE) {
      set({ user: null, ready: true });
      return;
    }
    try {
      const res = await fetch("/api/spotify");
      const json = (await res.json()) as { user?: SpotifyUser | null; off?: boolean };
      if (json.off) {
        set({ user: null, ready: true });
        return;
      }
      set({ user: json.user ?? null, ready: true });
    } catch {
      set({ user: null, ready: true });
    }
  },
  login: () => {
    if (!SPOTIFY_LIVE) return;
    window.location.href = "/api/spotify/login";
  },
  logout: async () => {
    if (!SPOTIFY_LIVE) return;
    await fetch("/api/spotify", { method: "POST", body: JSON.stringify({ op: "logout" }) });
    set({ user: null, ready: true });
  },
}));

export function spotifyReadyToPlay() {
  if (!SPOTIFY_LIVE) return true;
  return Boolean(useSpotify.getState().user);
}
