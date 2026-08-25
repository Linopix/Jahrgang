import { createServerFn } from "@tanstack/react-start";
import { matchCatalogSong, songId } from "./catalog";
import { lookupPreview, type PreviewResult } from "./preview";
import { parsePlaylistInput, type ListedTrack, type PlaylistRef } from "./playlist-url";
import type { CatalogSong } from "./types";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";

const MAX_TRACKS = 80;

export type PlaylistTrack = CatalogSong & {
  previewUrl?: string;
  artworkUrl?: string;
};

export type PlaylistPeek = {
  title: string;
  count: number;
  url: string;
};

type RawTrack = {
  title: string;
  artist: string;
  year?: number;
  previewUrl?: string;
  artworkUrl?: string;
};

function headers() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "text/html,application/json",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  };
}

type SpotifyEmbedTrack = {
  title?: string;
  subtitle?: string;
  audioPreview?: { url?: string };
};

type SpotifyNextData = {
  props?: {
    pageProps?: {
      state?: {
        data?: {
          entity?: {
            name?: string;
            title?: string;
            trackList?: SpotifyEmbedTrack[];
          };
        };
      };
    };
  };
};

async function fromSpotify(ref: Extract<PlaylistRef, { source: "spotify" }>): Promise<{
  title: string;
  tracks: RawTrack[];
}> {
  const url = `https://open.spotify.com/embed/${ref.kind}/${ref.id}`;
  const res = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error("spotify");
  const html = await res.text();
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) throw new Error("spotify-parse");
  const data = JSON.parse(match[1]) as SpotifyNextData;
  const entity = data.props?.pageProps?.state?.data?.entity;
  const list = (entity?.trackList ?? []).slice(0, MAX_TRACKS);
  const tracks: RawTrack[] = [];
  for (const row of list) {
    const title = row.title?.trim();
    const artist = row.subtitle?.split(",")[0]?.trim();
    if (!title || !artist) continue;
    tracks.push({
      title,
      artist,
      previewUrl: row.audioPreview?.url || undefined,
    });
  }
  return {
    title: entity?.name || entity?.title || "Playlist",
    tracks,
  };
}

type DeezerTrack = {
  title?: string;
  artist?: { name?: string };
  preview?: string;
  album?: { cover_medium?: string; cover_big?: string; title?: string };
};

async function fromDeezer(ref: Extract<PlaylistRef, { source: "deezer" }>): Promise<{
  title: string;
  tracks: RawTrack[];
}> {
  const start = `https://api.deezer.com/${ref.kind}/${ref.id}`;
  const first = await fetch(start, { signal: AbortSignal.timeout(10000) });
  if (!first.ok) throw new Error("deezer");
  const body = (await first.json()) as {
    title?: string;
    name?: string;
    error?: { message?: string };
    tracks?: { data?: DeezerTrack[]; next?: string };
  };
  if (body.error) throw new Error("deezer");
  const tracks: RawTrack[] = [];
  const initial = body.tracks?.data ?? [];
  for (const row of initial) {
    const title = row.title?.trim();
    const artist = row.artist?.name?.trim();
    if (!title || !artist) continue;
    tracks.push({
      title,
      artist,
      previewUrl: row.preview || undefined,
      artworkUrl: row.album?.cover_big ?? row.album?.cover_medium,
    });
  }
  let nextUrl = body.tracks?.next;
  while (nextUrl && tracks.length < MAX_TRACKS) {
    const page = await fetch(nextUrl, { signal: AbortSignal.timeout(10000) });
    if (!page.ok) break;
    const json = (await page.json()) as { data?: DeezerTrack[]; next?: string };
    for (const row of json.data ?? []) {
      const title = row.title?.trim();
      const artist = row.artist?.name?.trim();
      if (!title || !artist) continue;
      tracks.push({
        title,
        artist,
        previewUrl: row.preview || undefined,
        artworkUrl: row.album?.cover_big ?? row.album?.cover_medium,
      });
      if (tracks.length >= MAX_TRACKS) break;
    }
    nextUrl = json.next;
  }
  return {
    title: body.title || body.name || "Playlist",
    tracks: tracks.slice(0, MAX_TRACKS),
  };
}

function fromList(tracks: ListedTrack[]): { title: string; tracks: RawTrack[] } {
  return {
    title: "Eigene Liste",
    tracks: tracks.slice(0, MAX_TRACKS).map((row) => ({
      title: row.title,
      artist: row.artist,
      year: row.year,
    })),
  };
}

async function fillSpotify(
  query: { id: string; title: string; artist: string; year: number },
  base: PreviewResult,
): Promise<PreviewResult> {
  if (base.previewUrl || !SPOTIFY_LIVE) return base;
  try {
    const { searchSpotifyPreview } = await import("@/lib/spotify/preview.server");
    const extra = await searchSpotifyPreview(query);
    return extra?.previewUrl ? extra : base;
  } catch {
    return base;
  }
}

async function loadRaw(url: string): Promise<{ title: string; tracks: RawTrack[]; url: string }> {
  const ref = parsePlaylistInput(url);
  if (!ref) {
    throw new Error("unsupported");
  }
  const packed =
    ref.source === "spotify"
      ? await fromSpotify(ref)
      : ref.source === "deezer"
        ? await fromDeezer(ref)
        : fromList(ref.tracks);
  return { ...packed, url: url.trim() };
}

async function hydrate(tracks: RawTrack[]): Promise<PlaylistTrack[]> {
  const out: PlaylistTrack[] = [];
  const pending: RawTrack[] = [];

  for (const raw of tracks) {
    const known = matchCatalogSong(raw.title, raw.artist);
    if (known) {
      out.push({
        ...known,
        previewUrl: raw.previewUrl,
        artworkUrl: raw.artworkUrl,
      });
      continue;
    }
    if (raw.year && raw.year >= 1950) {
      out.push({
        id: songId(raw.title, raw.artist, raw.year),
        title: raw.title,
        artist: raw.artist,
        year: raw.year,
        previewUrl: raw.previewUrl,
        artworkUrl: raw.artworkUrl,
      });
      continue;
    }
    pending.push(raw);
  }

  const concurrency = 6;
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    const resolved = await Promise.all(
      batch.map(async (raw) => {
        const id = songId(raw.title, raw.artist, 0);
        const found = await lookupPreview({
          id,
          title: raw.title,
          artist: raw.artist,
          year: raw.year ?? 0,
        });
        const filled = await fillSpotify(
          { id, title: raw.title, artist: raw.artist, year: raw.year ?? 0 },
          found,
        );
        const year = filled.year;
        const maxYear = new Date().getFullYear() + 1;
        if (!year || year < 1950 || year > maxYear) return null;
        const song: PlaylistTrack = {
          id: songId(raw.title, raw.artist, year),
          title: raw.title,
          artist: raw.artist,
          year,
          previewUrl: filled.previewUrl || raw.previewUrl,
          artworkUrl: filled.artworkUrl || raw.artworkUrl,
        };
        return song;
      }),
    );
    for (const song of resolved) {
      if (song) out.push(song);
    }
  }

  const seen = new Set<string>();
  return out.filter((song) => {
    if (seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

export const peekPlaylist = createServerFn({ method: "POST" })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; peek: PlaylistPeek } | { ok: false; error: string }> => {
    try {
      const loaded = await loadRaw(data.url);
      if (loaded.tracks.length < 4) {
        return {
          ok: false,
          error: "Zu wenige Titel. Mindestens vier werden gebraucht.",
        };
      }
      return {
        ok: true,
        peek: {
          title: loaded.title,
          count: loaded.tracks.length,
          url: loaded.url,
        },
      };
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "unsupported") {
        return {
          ok: false,
          error: "Öffentlichen Spotify- oder Deezer-Link einfügen, oder vier Zeilen Interpret – Titel.",
        };
      }
      return {
        ok: false,
        error: "Playlist nicht lesbar. Sie muss öffentlich sein.",
      };
    }
  });

export const loadPlaylistSongs = createServerFn({ method: "POST" })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<PlaylistTrack[]> => {
    const loaded = await loadRaw(data.url);
    return hydrate(loaded.tracks);
  });
