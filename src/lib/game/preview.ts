import { createServerFn } from "@tanstack/react-start";

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
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

async function fromItunes(query: PreviewQuery): Promise<PreviewResult | null> {
  const term = encodeURIComponent(`${query.artist} ${query.title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=8`;
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

export async function lookupPreview(query: PreviewQuery): Promise<PreviewResult> {
  try {
    const itunes = await fromItunes(query);
    if (itunes?.previewUrl) return itunes;
  } catch {
    /* fall through */
  }
  try {
    const deezer = await fromDeezer(query);
    if (deezer?.previewUrl) return deezer;
  } catch {
    /* fall through */
  }
  return { id: query.id, previewUrl: null, artworkUrl: null, year: undefined };
}

async function resolveOne(query: PreviewQuery): Promise<PreviewResult> {
  return lookupPreview(query);
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
