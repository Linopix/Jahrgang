import { createServerFn } from "@tanstack/react-start";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";

export type PreviewQuery = {
  id: string;
  title: string;
  artist: string;
  year: number;
};

export type PreviewResult = {
  id: string;
  previewUrl: string | null;
  artworkUrl: string | null;
  year?: number;
};

type ITunesSong = {
  artistName?: string;
  trackName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  releaseDate?: string;
};

type DeezerTrack = {
  title?: string;
  preview?: string;
  artist?: { name?: string };
  album?: { cover_medium?: string; cover_big?: string };
};

function fold(value: string) {
  const parts = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\$/g, "s")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  const out: string[] = [];
  let letters = "";
  const flush = () => {
    if (letters) {
      out.push(letters);
      letters = "";
    }
  };
  for (const part of parts) {
    if (part.length === 1) letters += part;
    else {
      flush();
      out.push(part);
    }
  }
  flush();
  return out.join(" ");
}

function scoreMatch(
  artist: string,
  title: string,
  year: number,
  foundArtist: string,
  foundTitle: string,
  foundYear?: number,
) {
  const a = fold(artist);
  const t = fold(title);
  const fa = fold(foundArtist);
  const ft = fold(foundTitle);
  let score = 0;
  if (fa === a) score += 4;
  else if (fa.includes(a) || a.includes(fa)) score += 3;
  if (ft === t) score += 4;
  else if (ft.includes(t) || t.includes(ft)) score += 3;
  if (foundYear !== undefined && year > 1900 && Math.abs(foundYear - year) <= 1) score += 2;
  else if (foundYear !== undefined && year > 1900 && Math.abs(foundYear - year) <= 3) score += 1;
  return score;
}

async function fromItunes(query: PreviewQuery, country?: string): Promise<PreviewResult | null> {
  const term = encodeURIComponent(`${query.artist} ${query.title}`);
  const region = country ? `&country=${country}` : "";
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=8${region}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: ITunesSong[] };
  const ranked = (json.results ?? [])
    .filter((row) => row.previewUrl)
    .map((row) => {
      const year = row.releaseDate
        ? new Date(row.releaseDate).getFullYear()
        : undefined;
      return {
        row,
        score: scoreMatch(
          query.artist,
          query.title,
          query.year,
          row.artistName ?? "",
          row.trackName ?? "",
          year,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 5 || !best.row.previewUrl) return null;
  const art = best.row.artworkUrl100?.replace("100x100bb", "400x400bb") ?? null;
  const year = best.row.releaseDate
    ? new Date(best.row.releaseDate).getFullYear()
    : undefined;
  return {
    id: query.id,
    previewUrl: best.row.previewUrl,
    artworkUrl: art,
    year: Number.isFinite(year) ? year : undefined,
  };
}

async function fromDeezer(query: PreviewQuery): Promise<PreviewResult | null> {
  const term = encodeURIComponent(`${query.artist} ${query.title}`);
  const url = `https://api.deezer.com/search?q=${term}&limit=8`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: DeezerTrack[] };
  const ranked = (json.data ?? [])
    .filter((row) => row.preview)
    .map((row) => ({
      row,
      score: scoreMatch(
        query.artist,
        query.title,
        query.year,
        row.artist?.name ?? "",
        row.title ?? "",
      ),
    }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 5 || !best.row.preview) return null;
  return {
    id: query.id,
    previewUrl: best.row.preview,
    artworkUrl: best.row.album?.cover_big ?? best.row.album?.cover_medium ?? null,
  };
}

async function fromDeezerQuoted(query: PreviewQuery): Promise<PreviewResult | null> {
  const q = `artist:"${query.artist}" track:"${query.title.replace(/"/g, "")}"`;
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: DeezerTrack[] };
  const hit = (json.data ?? []).find((row) => {
    if (!row.preview) return false;
    const titleScore = scoreMatch(
      query.artist,
      query.title,
      query.year,
      row.artist?.name ?? "",
      row.title ?? "",
    );
    const t = fold(query.title);
    const ft = fold(row.title ?? "");
    return ft === t || ft.includes(t) || t.includes(ft) || titleScore >= 4;
  });
  if (!hit?.preview) return null;
  return {
    id: query.id,
    previewUrl: hit.preview,
    artworkUrl: hit.album?.cover_big ?? hit.album?.cover_medium ?? null,
  };
}

export async function lookupPreview(query: PreviewQuery): Promise<PreviewResult> {
  for (const country of ["de", "us"] as const) {
    try {
      const itunes = await fromItunes(query, country);
      if (itunes?.previewUrl) return itunes;
    } catch {
      /* next */
    }
  }
  try {
    const deezer = await fromDeezer(query);
    if (deezer?.previewUrl) return deezer;
  } catch {
    /* next */
  }
  try {
    const quoted = await fromDeezerQuoted(query);
    if (quoted?.previewUrl) return quoted;
  } catch {
    /* fall through */
  }
  return { id: query.id, previewUrl: null, artworkUrl: null, year: undefined };
}

async function withSpotify(query: PreviewQuery, base: PreviewResult): Promise<PreviewResult> {
  if (base.previewUrl || !SPOTIFY_LIVE) return base;
  try {
    const { searchSpotifyPreview } = await import("@/lib/spotify/preview.server");
    const extra = await searchSpotifyPreview(query);
    return extra?.previewUrl ? extra : base;
  } catch {
    return base;
  }
}

async function resolveOne(query: PreviewQuery): Promise<PreviewResult> {
  return withSpotify(query, await lookupPreview(query));
}

export const resolvePreviews = createServerFn({ method: "POST" })
  .validator((data: { queries: PreviewQuery[] }) => data)
  .handler(async ({ data }): Promise<PreviewResult[]> => {
    const queries = data.queries.slice(0, 24);
    const results: PreviewResult[] = [];
    const concurrency = 6;
    for (let i = 0; i < queries.length; i += concurrency) {
      const batch = queries.slice(i, i + concurrency);
      const resolved = await Promise.all(batch.map(resolveOne));
      results.push(...resolved);
    }
    return results;
  });
