import { SPOTIFY_LIVE } from "./flags";
import type { PreviewQuery, PreviewResult } from "@/lib/game/preview";

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

function env(key: string) {
  return process.env[key]?.trim() || "";
}

type Token = { access: string; exp: number };
let cached: Token | null = null;

async function clientToken(): Promise<string | null> {
  if (!SPOTIFY_LIVE) return null;
  const id = env("SPOTIFY_CLIENT_ID");
  const secret = env("SPOTIFY_CLIENT_SECRET");
  if (!id || !secret) return null;
  if (cached && Date.now() < cached.exp - 30_000) return cached.access;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cached = {
    access: json.access_token,
    exp: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cached.access;
}

type SpotifyTrack = {
  id?: string;
  name?: string;
  preview_url?: string | null;
  album?: { images?: { url?: string }[]; release_date?: string };
  artists?: { name?: string }[];
};

const EMBED_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/json",
};

async function embedPreview(trackId: string): Promise<{ url: string; art: string | null; year?: number } | null> {
  const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
    headers: EMBED_HEADERS,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) return null;
  try {
    const data = JSON.parse(match[1]) as {
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
          };
        };
      };
    };
    const entity = data.props?.pageProps?.state?.data?.entity;
    const url = entity?.audioPreview?.url;
    if (!url) return null;
    const art =
      [...(entity?.visualIdentity?.image ?? [])].sort((a, b) => (b.maxWidth ?? 0) - (a.maxWidth ?? 0))[0]
        ?.url ?? null;
    const yearRaw = entity?.releaseDate?.isoString;
    return {
      url,
      art,
      year: yearRaw ? new Date(yearRaw).getFullYear() : undefined,
    };
  } catch {
    return null;
  }
}

export async function searchSpotifyPreview(query: PreviewQuery): Promise<PreviewResult | null> {
  if (!SPOTIFY_LIVE) return null;
  const token = await clientToken();
  if (!token) return null;
  const market = env("SPOTIFY_MARKET") || "DE";
  const q = encodeURIComponent(`track:${query.title} artist:${query.artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=8&market=${encodeURIComponent(market)}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (res.status === 401) {
    cached = null;
    return null;
  }
  if (!res.ok) return null;
  const json = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  const ranked = (json.tracks?.items ?? [])
    .map((row) => {
      const year = row.album?.release_date ? Number(row.album.release_date.slice(0, 4)) : undefined;
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
  const year = best.row.album?.release_date
    ? Number(best.row.album.release_date.slice(0, 4))
    : undefined;
  const art = best.row.album?.images?.[0]?.url ?? null;
  if (best.row.preview_url) {
    return { id: query.id, previewUrl: best.row.preview_url, artworkUrl: art, year };
  }
  const clip = await embedPreview(best.row.id);
  if (!clip) return null;
  return {
    id: query.id,
    previewUrl: clip.url,
    artworkUrl: clip.art ?? art,
    year: clip.year ?? year,
  };
}
