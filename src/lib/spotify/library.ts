import { createServerFn } from "@tanstack/react-start";
import type { PlaylistTrack } from "@/lib/game/playlist";

export const loadSpotifyLibrary = createServerFn({ method: "POST" }).handler(
  async (): Promise<PlaylistTrack[]> => {
    const { readSpotifyLibrary } = await import("./library.server");
    return readSpotifyLibrary();
  },
);

export const peekSpotifyLibrary = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ count: number }> => {
    const { readSpotifyLibrary } = await import("./library.server");
    const tracks = await readSpotifyLibrary();
    return { count: tracks.length };
  },
);
