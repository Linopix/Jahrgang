import { getRequest } from "@tanstack/react-start/server";
import { SPOTIFY_LIVE } from "./flags";
import { liveAccessToken } from "./oauth.server";
import { matchCatalogSong, songId } from "@/lib/game/catalog";
import type { PlaylistTrack } from "@/lib/game/playlist";

const MAX_TRACKS = 80;

type SpotifySaved = {
  track?: {
    id?: string;
    name?: string;
    preview_url?: string | null;
    artists?: { name?: string }[];
    album?: { release_date?: string; images?: { url?: string }[] };
  } | null;
};

type SpotifyPlaylist = {
  id?: string;
};

function yearOf(date?: string) {
  const year = date ? Number(date.slice(0, 4)) : 0;
  return year >= 1950 && year <= new Date().getFullYear() + 1 ? year : 0;
}

function asTrack(row: SpotifySaved["track"]): PlaylistTrack | null {
  if (!row) return null;
  const title = row.name?.trim();
  const artist = row.artists?.[0]?.name?.trim();
  if (!title || !artist) return null;
  const year = yearOf(row.album?.release_date);
  if (!year) return null;
  const known = matchCatalogSong(title, artist);
  const id = known?.id ?? songId(title, artist, year);
  return {
    id,
    title: known?.title ?? title,
    artist: known?.artist ?? artist,
    year: known?.year ?? year,
    german: known?.german,
    previewUrl: row.preview_url || undefined,
    artworkUrl: row.album?.images?.[0]?.url,
  };
}

async function getJson<T>(url: string, access: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function savedTracks(access: string): Promise<PlaylistTrack[]> {
  const out: PlaylistTrack[] = [];
  let url: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";
  while (url && out.length < MAX_TRACKS) {
    const json: { items?: SpotifySaved[]; next?: string | null } | null = await getJson(
      url,
      access,
    );
    if (!json) break;
    for (const item of json.items ?? []) {
      const song = asTrack(item.track);
      if (song) out.push(song);
      if (out.length >= MAX_TRACKS) break;
    }
    url = json.next ?? null;
  }
  return out;
}

async function playlistTracks(access: string): Promise<PlaylistTrack[]> {
  const lists = await getJson<{ items?: SpotifyPlaylist[] }>(
    "https://api.spotify.com/v1/me/playlists?limit=20",
    access,
  );
  const out: PlaylistTrack[] = [];
  for (const list of lists?.items ?? []) {
    if (!list.id || out.length >= MAX_TRACKS) break;
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${list.id}/tracks?limit=50&fields=items(track(id,name,preview_url,artists(name),album(release_date,images))),next`;
    while (url && out.length < MAX_TRACKS) {
      const json: { items?: SpotifySaved[]; next?: string | null } | null = await getJson(
      url,
      access,
    );
      if (!json) break;
      for (const item of json.items ?? []) {
        const song = asTrack(item.track);
        if (song) out.push(song);
        if (out.length >= MAX_TRACKS) break;
      }
      url = json.next ?? null;
    }
  }
  return out;
}

export async function readSpotifyLibrary(): Promise<PlaylistTrack[]> {
  if (!SPOTIFY_LIVE) return [];
  const request = getRequest();
  if (!request) return [];
  const access = await liveAccessToken(request);
  if (!access) return [];
  const liked = await savedTracks(access);
  const rest = liked.length >= MAX_TRACKS ? [] : await playlistTracks(access);
  const seen = new Set<string>();
  const out: PlaylistTrack[] = [];
  for (const song of [...liked, ...rest]) {
    if (seen.has(song.id)) continue;
    seen.add(song.id);
    out.push(song);
    if (out.length >= MAX_TRACKS) break;
  }
  return out;
}
