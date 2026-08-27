import { createServerFn } from "@tanstack/react-start";
import type { NamePair } from "./guess.ts";
import { mergeNamePairs } from "./guess.ts";
import seeded from "./names-data.json";

const KEY = "jg-names-v1";
const MAX_AGE = 24 * 60 * 60 * 1000;
const MAX_HINTS = 8;
const UA = "Jahrgang/1.0 (jahrgang.game@icloud.com)";

type Cache = { at: number; songs: NamePair[] };

let memory: Cache | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function asPairs(rows: unknown): NamePair[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const title = String((row as { title?: unknown }).title ?? "").trim();
    const artist = String((row as { artist?: unknown }).artist ?? "").trim();
    if (!title || !artist) return [];
    return [{ title, artist }];
  });
}

function seedPairs(): NamePair[] {
  return asPairs(seeded);
}

function readStored(): Cache | null {
  if (typeof localStorage === "undefined") return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as Cache;
    if (!Array.isArray(row.songs) || typeof row.at !== "number") return null;
    return { at: row.at, songs: asPairs(row.songs) };
  } catch {
    return null;
  }
}

function writeStored(cache: Cache) {
  memory = cache;
  if (typeof localStorage === "undefined") {
    emit();
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* quota */
  }
  emit();
}

export function getExtraNames(): NamePair[] {
  const stored = memory ?? readStored();
  return mergeNamePairs([seedPairs(), stored?.songs ?? []]);
}

export function subscribeNames(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

type MbRecording = {
  title?: string;
  "artist-credit"?: { name?: string; artist?: { name?: string } }[];
};

type MbArtist = { name?: string };

function recordingPair(row: MbRecording): NamePair | null {
  const title = row.title?.trim();
  const artist =
    row["artist-credit"]?.[0]?.name?.trim() || row["artist-credit"]?.[0]?.artist?.name?.trim();
  if (!title || !artist) return null;
  return { title, artist };
}

let lastMbAt = 0;
let mbQueue: Promise<unknown> = Promise.resolve();

async function mbGet(path: string): Promise<unknown> {
  const run = mbQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastMbAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastMbAt = Date.now();
    const res = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("musicbrainz");
    return res.json();
  });
  mbQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function fetchNameIndex(): Promise<NamePair[]> {
  const queries = [
    "tag:pop AND firstreleasedate:[1980 TO 1989] AND status:official",
    "tag:rock AND firstreleasedate:[1970 TO 1979] AND status:official",
    "tag:hip-hop AND firstreleasedate:[2010 TO 2026] AND status:official",
    "tag:electronic AND firstreleasedate:[1990 TO 1999] AND status:official",
    "tag:soul AND firstreleasedate:[1960 TO 1979] AND status:official",
    "firstreleasedate:[2020 TO 2026] AND status:official",
  ];
  const out: NamePair[] = [];
  for (const query of queries) {
    try {
      const json = (await mbGet(
        `recording?query=${encodeURIComponent(query)}&fmt=json&limit=80`,
      )) as { recordings?: MbRecording[] };
      for (const row of json.recordings ?? []) {
        const pair = recordingPair(row);
        if (pair) out.push(pair);
      }
    } catch {
      /* nächste Abfrage */
    }
  }
  return mergeNamePairs([out]);
}

export const loadNameIndex = createServerFn({ method: "POST" }).handler(async () => {
  try {
    return await fetchNameIndex();
  } catch {
    return [] as NamePair[];
  }
});

export const searchNameHints = createServerFn({ method: "POST" })
  .validator((data: { q: string; kind: "artist" | "title" }) => data)
  .handler(async ({ data }): Promise<NamePair[]> => {
    const q = data.q.trim().slice(0, 48);
    if (q.length < 2) return [];
    try {
      if (data.kind === "artist") {
        const json = (await mbGet(
          `artist?query=${encodeURIComponent(`artist:${q}*`)}&fmt=json&limit=${MAX_HINTS}`,
        )) as { artists?: MbArtist[] };
        return mergeNamePairs(
          (json.artists ?? []).map((row) => {
            const artist = row.name?.trim();
            return artist ? [{ title: artist, artist }] : [];
          }),
        );
      }
      const json = (await mbGet(
        `recording?query=${encodeURIComponent(`recording:${q}*`)}&fmt=json&limit=${MAX_HINTS}`,
      )) as { recordings?: MbRecording[] };
      return mergeNamePairs([
        (json.recordings ?? []).flatMap((row) => {
          const pair = recordingPair(row);
          return pair ? [pair] : [];
        }),
      ]);
    } catch {
      return [];
    }
  });

export async function refreshNames(force = false) {
  const stored = memory ?? readStored();
  if (!force && stored && Date.now() - stored.at < MAX_AGE) {
    memory = stored;
    return stored.songs;
  }
  const songs = await loadNameIndex();
  if (songs.length === 0) {
    if (stored) memory = stored;
    return stored?.songs ?? seedPairs();
  }
  writeStored({ at: Date.now(), songs });
  return songs;
}

export { MAX_HINTS };
