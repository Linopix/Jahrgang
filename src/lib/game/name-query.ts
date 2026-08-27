export type HintKind = "artist" | "title" | "songs";

export const MAX_HINTS = 8;
export const MAX_SONGS = 100;

export function hintQuery(kind: HintKind, q: string): string {
  const term = q.trim().slice(0, 48).replace(/"/g, "");
  if (kind === "artist") return `artist:${term}*`;
  if (kind === "songs") return `artist:"${term}" AND status:official`;
  return `recording:${term}*`;
}

export function hintLimit(kind: HintKind): number {
  return kind === "songs" ? MAX_SONGS : kind === "title" ? 25 : MAX_HINTS;
}
