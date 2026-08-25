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

const SPOTIFY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/json",
};

type SpotifyEmbedState = {
  props?: {
    pageProps?: {
      state?: {
        data?: {
          entity?: {
            audioPreview?: { url?: string };
            visualIdentity?: { image?: { url?: string; maxWidth?: number }[] };
            releaseDate?: { isoString?: string };
          };
        };
        settings?: {
          session?: {
            accessToken?: string;
            accessTokenExpirationTimestampMs?: number;
          };
        };
      };
    };
  };
};

let spotifyAuth: { token: string; exp: number } | null = null;
let spotifyChain: Promise<unknown> = Promise.resolve();

function parseNextData(html: string): SpotifyEmbedState | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as SpotifyEmbedState;
  } catch {
    return null;
  }
}

async function spotifyEmbed(trackId: string): Promise<SpotifyEmbedState | null> {
  const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
    headers: SPOTIFY_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return parseNextData(await res.text());
}

async function spotifyToken(): Promise<string | null> {
  if (spotifyAuth && Date.now() < spotifyAuth.exp - 20_000) return spotifyAuth.token;
  const data = await spotifyEmbed("4cOdK2wGLETKBW3PvgPWqT");
  const session = data?.props?.pageProps?.state?.settings?.session;
  if (!session?.accessToken) return null;
  spotifyAuth = {
    token: session.accessToken,
    exp: session.accessTokenExpirationTimestampMs ?? Date.now() + 30 * 60 * 1000,
  };
  return spotifyAuth.token;
}

type SpotifyTrack = {
  id?: string;
  name?: string;
  preview_url?: string | null;
  album?: { images?: { url?: string }[]; release_date?: string };
  artists?: { name?: string }[];
};

async function fromSpotify(query: PreviewQuery): Promise<PreviewResult | null> {
  const token = await spotifyToken();
  if (!token) return null;
  const q = encodeURIComponent(`track:${query.title} artist:${query.artist}`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=8&market=DE`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 401) {
    spotifyAuth = null;
    return null;
  }
  if (!res.ok) return null;
  const json = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  const ranked = (json.tracks?.items ?? [])
    .map((row) => {
      const year = row.album?.release_date
        ? Number(row.album.release_date.slice(0, 4))
        : undefined;
      return {
        row,
        score: scoreMatch(
          query.artist,
          query.title,
          query.year,
          row.artists?.[0]?.name ?? "",
          row.name ?? "",
          year,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 5 || !best.row.id) return null;
  if (best.row.preview_url) {
    return {
      id: query.id,
      previewUrl: best.row.preview_url,
      artworkUrl: best.row.album?.images?.[0]?.url ?? null,
      year: best.row.album?.release_date
        ? Number(best.row.album.release_date.slice(0, 4))
        : undefined,
    };
  }
  const embed = await spotifyEmbed(best.row.id);
  const entity = embed?.props?.pageProps?.state?.data?.entity;
  const preview = entity?.audioPreview?.url;
  if (!preview) return null;
  const art =
    [...(entity?.visualIdentity?.image ?? [])].sort(
      (a, b) => (b.maxWidth ?? 0) - (a.maxWidth ?? 0),
    )[0]?.url ??
    best.row.album?.images?.[0]?.url ??
    null;
  const yearRaw = entity?.releaseDate?.isoString;
  return {
    id: query.id,
    previewUrl: preview,
    artworkUrl: art,
    year: yearRaw ? new Date(yearRaw).getFullYear() : undefined,
  };
}

function enqueueSpotify(query: PreviewQuery): Promise<PreviewResult | null> {
  const run = spotifyChain.then(() => fromSpotify(query), () => fromSpotify(query));
  spotifyChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
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
    /* next */
  }
  try {
    const spotify = await enqueueSpotify(query);
    if (spotify?.previewUrl) return spotify;
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
