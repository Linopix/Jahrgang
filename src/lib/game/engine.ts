import type { CatalogSong, Player, ResolvedSong } from "./types";

export function fisherYates<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

export function canPlace(
  timeline: { year: number }[],
  index: number,
  year: number,
): boolean {
  if (index < 0 || index > timeline.length) return false;
  const left = timeline[index - 1];
  const right = timeline[index];
  if (left && year < left.year) return false;
  if (right && year > right.year) return false;
  return true;
}

export function insertSong(
  timeline: ResolvedSong[],
  index: number,
  song: ResolvedSong,
): ResolvedSong[] {
  const next = timeline.slice();
  next.splice(index, 0, song);
  return next;
}

export function decadeLabel(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}er`;
}

export function winner(players: Player[], target: number): Player | null {
  return players.find((player) => player.timeline.length >= target) ?? null;
}

export function uniqueYearsSpread(songs: CatalogSong[]): CatalogSong[] {
  const byYear = new Map<number, CatalogSong[]>();
  for (const song of songs) {
    const list = byYear.get(song.year) ?? [];
    list.push(song);
    byYear.set(song.year, list);
  }
  const years = fisherYates([...byYear.keys()]);
  const picked: CatalogSong[] = [];
  for (const year of years) {
    const list = byYear.get(year);
    if (!list?.length) continue;
    const choice = list[Math.floor(Math.random() * list.length)];
    if (choice) picked.push(choice);
  }
  return fisherYates(picked);
}
