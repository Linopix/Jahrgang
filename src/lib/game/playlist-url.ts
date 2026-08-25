export type ListedTrack = {
  title: string;
  artist: string;
  year?: number;
};

export type PlaylistRef =
  | { source: "spotify"; kind: "playlist" | "album"; id: string }
  | { source: "deezer"; kind: "playlist" | "album"; id: string }
  | { source: "list"; tracks: ListedTrack[] };

const SPOTIFY_RE =
  /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?|spotify:)(playlist|album)[/:]([A-Za-z0-9]+)/i;
const DEEZER_RE = /deezer\.com\/(?:[a-z]{2}\/)?(playlist|album)\/(\d+)/i;

export function parseTrackLine(line: string): ListedTrack | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const parts = trimmed
    .split(/\s+[–—-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  let year: number | undefined;
  const last = parts[parts.length - 1];
  if (/^(19|20)\d{2}$/.test(last)) {
    year = Number(last);
    parts.pop();
  }
  if (parts.length < 2) return null;
  return {
    artist: parts[0],
    title: parts.slice(1).join(" – "),
    year,
  };
}

export function parseTrackList(text: string): ListedTrack[] {
  const tracks: ListedTrack[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const row = parseTrackLine(line);
    if (!row) continue;
    const key = `${row.artist.toLowerCase()}|${row.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tracks.push(row);
  }
  return tracks;
}

export function parsePlaylistUrl(input: string): PlaylistRef | null {
  return parsePlaylistInput(input);
}

export function parsePlaylistInput(input: string): PlaylistRef | null {
  const value = input.trim();
  if (!value) return null;
  const first = value.split(/\r?\n/)[0]?.trim() ?? "";
  if (!first.includes("\n") && !value.includes("\n")) {
    const spotify = value.match(SPOTIFY_RE);
    if (spotify?.[1] && spotify[2]) {
      return {
        source: "spotify",
        kind: spotify[1].toLowerCase() as "playlist" | "album",
        id: spotify[2],
      };
    }
    const deezer = value.match(DEEZER_RE);
    if (deezer?.[1] && deezer[2]) {
      return {
        source: "deezer",
        kind: deezer[1].toLowerCase() as "playlist" | "album",
        id: deezer[2],
      };
    }
  }
  const tracks = parseTrackList(value);
  if (tracks.length >= 4) return { source: "list", tracks };
  return null;
}
