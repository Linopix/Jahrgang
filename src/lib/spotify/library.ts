import { createServerFn } from "@tanstack/react-start";
import type { CatalogSong } from "@/lib/game/types";
import type { PlaylistTrack } from "@/lib/game/playlist";

export type LibraryPeek = {
  count: number;
  songs: CatalogSong[];
};

function compact(tracks: PlaylistTrack[]): CatalogSong[] {
  return tracks.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    year: song.year,
    german: song.german,
    genre: song.genre,
  }));
}

export const loadSpotifyLibrary = createServerFn({ method: "POST" }).handler(
  async (): Promise<PlaylistTrack[]> => {
    const { readSpotifyLibrary } = await import("./library.server");
    return readSpotifyLibrary();
  },
);

export const peekSpotifyLibrary = createServerFn({ method: "POST" }).handler(
  async (): Promise<LibraryPeek> => {
    const { readSpotifyLibrary } = await import("./library.server");
    const tracks = await readSpotifyLibrary();
    return { count: tracks.length, songs: compact(tracks) };
  },
);
