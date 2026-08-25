import { createServerFn } from "@tanstack/react-start";
import { matchCatalogSong, songId } from "./catalog";
import { lookupYear } from "./year";
import { parsePlaylistInput, type ListedTrack } from "./playlist-url";
import type { CatalogSong } from "./types";

const MAX_TRACKS = 80;

export type PlaylistTrack = CatalogSong;

export type PlaylistPeek = {
  title: string;
  count: number;
  url: string;
};

type DeezerTrack = {
  title?: string;
  artist?: { name?: string };
};

async function fromDeezer(kind: "playlist" | "album", id: string): Promise<{
  title: string;
  tracks: ListedTrack[];
}> {
  const start = `https://api.deezer.com/${kind}/${id}`;
  const first = await fetch(start, { signal: AbortSignal.timeout(10000) });
  if (!first.ok) throw new Error("deezer");
  const body = (await first.json()) as {
    title?: string;
    name?: string;
    error?: { message?: string };
    tracks?: { data?: DeezerTrack[]; next?: string };
  };
  if (body.error) throw new Error("deezer");
  const tracks: ListedTrack[] = [];
  const initial = body.tracks?.data ?? [];
  for (const row of initial) {
    const title = row.title?.trim();
    const artist = row.artist?.name?.trim();
    if (!title || !artist) continue;
    tracks.push({ title, artist });
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
      tracks.push({ title, artist });
      if (tracks.length >= MAX_TRACKS) break;
    }
    nextUrl = json.next;
  }
  return {
    title: body.title || body.name || "Playlist",
    tracks: tracks.slice(0, MAX_TRACKS),
  };
}

async function loadRaw(input: string): Promise<{ title: string; tracks: ListedTrack[]; url: string }> {
  const ref = parsePlaylistInput(input);
  if (!ref) throw new Error("unsupported");
  if (ref.source === "list") {
    return {
      title: `Eigene Liste`,
      tracks: ref.tracks.slice(0, MAX_TRACKS),
      url: input.trim(),
    };
  }
  const packed = await fromDeezer(ref.kind, ref.id);
  return { ...packed, url: input.trim() };
}

async function hydrate(tracks: ListedTrack[]): Promise<PlaylistTrack[]> {
  const out: PlaylistTrack[] = [];
  const pending: ListedTrack[] = [];

  for (const raw of tracks) {
    const known = matchCatalogSong(raw.title, raw.artist);
    if (known) {
      out.push(known);
      continue;
    }
    if (raw.year && raw.year >= 1950) {
      out.push({
        id: songId(raw.title, raw.artist, raw.year),
        title: raw.title,
        artist: raw.artist,
        year: raw.year,
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
        const year = await lookupYear(raw.title, raw.artist);
        if (!year) return null;
        return {
          id: songId(raw.title, raw.artist, year),
          title: raw.title,
          artist: raw.artist,
          year,
        } satisfies PlaylistTrack;
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
          error: "Mindestens vier Zeilen: Interpret – Titel. Optional das Jahr.",
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
          error: "Titelliste einfügen (Interpret – Titel) oder einen öffentlichen Deezer-Link.",
        };
      }
      return {
        ok: false,
        error: "Liste nicht lesbar. Öffentlichen Deezer-Link oder Textzeilen verwenden.",
      };
    }
  });

export const loadPlaylistSongs = createServerFn({ method: "POST" })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<PlaylistTrack[]> => {
    const loaded = await loadRaw(data.url);
    return hydrate(loaded.tracks);
  });
