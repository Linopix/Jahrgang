import { createServerFn } from "@tanstack/react-start";
import { matchCatalogSong, songId } from "./catalog.ts";
import type { CatalogSong } from "./types";

const KEY = "jg-fresh-v1";
const MAX_AGE = 12 * 60 * 60 * 1000;
const MAX_SONGS = 50;

export type FreshHit = {
  title: string;
  artist: string;
  year?: number;
  previewUrl?: string;
  artworkUrl?: string;
};

function yearOf(value?: string) {
  const year = value ? Number(String(value).slice(0, 4)) : 0;
  const max = new Date().getFullYear() + 1;
  return year >= 1950 && year <= max ? year : 0;
}

export function parseItunesChart(json: unknown): FreshHit[] {
  const feed = (json as { feed?: { results?: unknown; entry?: unknown } })?.feed;
  const results = Array.isArray(feed?.results) ? feed.results : null;
  if (results) {
    return results.flatMap((row) => {
      const item = row as { name?: string; artistName?: string; releaseDate?: string; artworkUrl100?: string };
      const title = item.name?.trim();
      const artist = item.artistName?.trim();
      if (!title || !artist) return [];
      return [{ title, artist, year: yearOf(item.releaseDate), artworkUrl: item.artworkUrl100 }];
    });
  }
  const entry = feed?.entry;
  const list = Array.isArray(entry) ? entry : entry ? [entry] : [];
  return list.flatMap((row) => {
    const item = row as {
      "im:name"?: { label?: string };
      "im:artist"?: { label?: string };
      "im:releaseDate"?: { label?: string };
      "im:image"?: { label?: string }[] | { label?: string };
    };
    const title = item["im:name"]?.label?.trim();
    const artist = item["im:artist"]?.label?.trim();
    if (!title || !artist) return [];
    const images = Array.isArray(item["im:image"]) ? item["im:image"] : item["im:image"] ? [item["im:image"]] : [];
    return [
      {
        title,
        artist,
        year: yearOf(item["im:releaseDate"]?.label),
        artworkUrl: images.at(-1)?.label,
      },
    ];
  });
}

export function parseDeezerChart(json: unknown): FreshHit[] {
  const list = (json as { data?: unknown[] })?.data;
  if (!Array.isArray(list)) return [];
  return list.flatMap((row) => {
    const item = row as {
      title?: string;
      preview?: string;
      artist?: { name?: string };
      album?: { cover_medium?: string; release_date?: string };
    };
    const title = item.title?.trim();
    const artist = item.artist?.name?.trim();
    if (!title || !artist) return [];
    return [
      {
        title,
        artist,
        year: yearOf(item.album?.release_date),
        previewUrl: item.preview || undefined,
        artworkUrl: item.album?.cover_medium,
      },
    ];
  });
}

export function freshSongsFromHits(hits: FreshHit[]): CatalogSong[] {
  const fallback = new Date().getFullYear();
  const seen = new Set<string>();
  const out: CatalogSong[] = [];
  for (const hit of hits) {
    const year = hit.year && hit.year > 0 ? hit.year : fallback;
    const known = matchCatalogSong(hit.title, hit.artist);
    const song: CatalogSong = {
      id: known?.id ?? songId(hit.title, hit.artist, year),
      title: known?.title ?? hit.title,
      artist: known?.artist ?? hit.artist,
      year: known?.year ?? year,
      german: known?.german,
      genre: known?.genre,
    };
    if (seen.has(song.id)) continue;
    seen.add(song.id);
    out.push(song);
    if (out.length >= MAX_SONGS) break;
  }
  return out;
}

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return res.json() as Promise<unknown>;
}

async function fetchFreshHits(): Promise<FreshHit[]> {
  const [apple, itunes, deezer] = await Promise.all([
    getJson("https://rss.applemarketingtools.com/api/v2/de/music/most-played/50/songs.json"),
    getJson("https://itunes.apple.com/de/rss/topsongs/limit=50/json"),
    getJson("https://api.deezer.com/chart/0/tracks?limit=50"),
  ]);
  return [
    ...(apple ? parseItunesChart(apple) : []),
    ...(itunes ? parseItunesChart(itunes) : []),
    ...(deezer ? parseDeezerChart(deezer) : []),
  ];
}

export const loadFreshCharts = createServerFn({ method: "POST" }).handler(async () => {
  try {
    return freshSongsFromHits(await fetchFreshHits());
  } catch {
    return [] as CatalogSong[];
  }
});

type Cache = { at: number; songs: CatalogSong[] };

let memory: Cache | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function readStored(): Cache | null {
  if (typeof localStorage === "undefined") return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as Cache;
    if (!Array.isArray(row.songs) || typeof row.at !== "number") return null;
    return row;
  } catch {
    return null;
  }
}

function writeStored(cache: Cache) {
  memory = cache;
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* quota */
  }
}

export function getFreshSongs(): CatalogSong[] {
  if (memory) return memory.songs;
  memory = readStored();
  return memory?.songs ?? [];
}

export function freshAge() {
  const at = memory?.at ?? readStored()?.at ?? 0;
  return at ? Date.now() - at : Number.POSITIVE_INFINITY;
}

export function subscribeFresh(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function refreshFreshSongs(force = false): Promise<CatalogSong[]> {
  if (!force && freshAge() < MAX_AGE && getFreshSongs().length > 0) return getFreshSongs();
  try {
    const songs = await loadFreshCharts();
    if (songs.length) {
      writeStored({ at: Date.now(), songs });
      emit();
      return songs;
    }
  } catch {
    /* keep cache */
  }
  return getFreshSongs();
}
