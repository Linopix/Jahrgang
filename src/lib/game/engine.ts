import type { CatalogSong, Player, ResolvedSong, SeriesStanding } from "./types";

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
  reverse = false,
): boolean {
  if (index < 0 || index > timeline.length) return false;
  const left = timeline[index - 1];
  const right = timeline[index];
  if (reverse) {
    if (left && year > left.year) return false;
    if (right && year < right.year) return false;
    return true;
  }
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

export function cardsNeeded(playerCount: number, target: number, open: boolean, cap = 80): number {
  const n = Math.max(1, playerCount);
  if (open) return Math.min(cap, Math.max(16, n * 6));
  const goal = Math.max(2, target);
  return Math.min(cap, n * (goal + 1));
}

export type PileStatus = "ok" | "tight" | "short" | "empty" | "unknown";

export function pileStatus(
  pile: number | null,
  playerCount: number,
  target: number,
  open: boolean,
): PileStatus {
  if (pile === null) return "unknown";
  if (pile <= 0) return "empty";
  const n = Math.max(1, playerCount);
  if (pile < n + 4) return "short";
  const need = cardsNeeded(n, target, open);
  if (pile < need) return "short";
  if (pile < need + n) return "tight";
  return "ok";
}

export function turnsUntilFirstWin(playerCount: number, target: number): number {
  const n = Math.max(1, playerCount);
  const extras = Math.max(1, target - 1);
  return (extras - 1) * n + 1;
}

export function winner(players: Player[], target: number): Player | null {
  return rankPlayers(players).find((player) => player.timeline.length >= target) ?? null;
}

export function rankPlayers(players: Player[]): Player[] {
  return players.slice().sort((a, b) => {
    if (b.timeline.length !== a.timeline.length) return b.timeline.length - a.timeline.length;
    if ((b.quiz ?? 0) !== (a.quiz ?? 0)) return (b.quiz ?? 0) - (a.quiz ?? 0);
    return a.misses - b.misses;
  });
}

export function mergeSeries(
  existing: SeriesStanding[],
  seats: { id: string; name: string }[],
): SeriesStanding[] {
  const map = new Map(existing.map((row) => [row.id, row]));
  return seats.map((seat) => {
    const prev = map.get(seat.id);
    return prev
      ? { ...prev, name: seat.name }
      : { id: seat.id, name: seat.name, wins: 0, points: 0 };
  });
}

export function tallySeries(
  series: SeriesStanding[],
  players: Player[],
  target: number,
): SeriesStanding[] {
  const champ = winner(players, target) ?? rankPlayers(players)[0];
  const map = new Map(series.map((row) => [row.id, { ...row }]));
  for (const player of players) {
    const row = map.get(player.id) ?? {
      id: player.id,
      name: player.name,
      wins: 0,
      points: 0,
    };
    row.name = player.name;
    row.points += player.timeline.length + player.quiz;
    if (champ && player.id === champ.id) row.wins += 1;
    map.set(player.id, row);
  }
  return [...map.values()].sort((a, b) => b.wins - a.wins || b.points - a.points);
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
