export type PlaylistRef =
  | { source: "spotify"; kind: "playlist" | "album"; id: string }
  | { source: "deezer"; kind: "playlist" | "album"; id: string };

const SPOTIFY_RE =
  /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?|spotify:)(playlist|album)[/:]([A-Za-z0-9]+)/i;
const DEEZER_RE = /deezer\.com\/(?:[a-z]{2}\/)?(playlist|album)\/(\d+)/i;

export function parsePlaylistUrl(input: string): PlaylistRef | null {
  const value = input.trim();
  if (!value) return null;
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
  return null;
}
