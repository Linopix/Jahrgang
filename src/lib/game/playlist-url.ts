export type ListedTrack = {
  title: string;
  artist: string;
  year?: number;
};

export type PlaylistRef =
  | { source: "list"; tracks: ListedTrack[] }
  | { source: "deezer"; kind: "playlist" | "album"; id: string };

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

export function parsePlaylistInput(input: string): PlaylistRef | null {
  const value = input.trim();
  if (!value) return null;
  const deezer = value.match(DEEZER_RE);
  if (deezer?.[1] && deezer[2] && !value.includes("\n")) {
    return {
      source: "deezer",
      kind: deezer[1].toLowerCase() as "playlist" | "album",
      id: deezer[2],
    };
  }
  const tracks = parseTrackList(value);
  if (tracks.length >= 4) return { source: "list", tracks };
  return null;
}
