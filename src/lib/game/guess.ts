import type { CustomRules, PlayVariant } from "./types.ts";
import { guessKind } from "./types.ts";

function stripMarks(input: string) {
  return input.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeGuess(input: string): string {
  let value = stripMarks(input).toLowerCase();
  value = value.replace(/ß/g, "ss");
  value = value.replace(/&/g, " and ");
  value = value.replace(/\+/g, " and ");
  value = value.replace(/\b(feat\.?|ft\.?|featuring)\b/g, " ");
  value = value.replace(/\(.*?\)/g, " ");
  value = value.replace(/\[.*?\]/g, " ");
  value = value.replace(/[''`´]/g, "");
  value = value.replace(/[^a-z0-9]+/g, " ");
  value = value.replace(/\b(the|die|der|das|le|la|el|los)\b/g, " ");
  value = value.replace(/\b(pt|part|vol|volume)\s*\d+\b/g, " ");
  return value.replace(/\s+/g, " ").trim();
}

function compactGuess(input: string) {
  return normalizeGuess(input).replace(/ /g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j += 1) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] ?? 99) + 1, (prev[j] ?? 99) + 1, (prev[j - 1] ?? 99) + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j] ?? 99;
  }
  return prev[b.length] ?? 99;
}

export function guessMatches(
  guess: string,
  actual: string,
  kind: "title" | "artist" = "title",
): boolean {
  const g = normalizeGuess(guess);
  const a = normalizeGuess(actual);
  if (!g || !a) return false;
  if (g === a) return true;
  if (compactGuess(guess) === compactGuess(actual)) return true;

  const shorter = g.length <= a.length ? g : a;
  const longer = g.length <= a.length ? a : g;
  if (shorter.length >= 5 && longer.includes(shorter) && shorter.length >= longer.length * 0.6) {
    return true;
  }

  const max = a.length >= 10 ? 2 : a.length >= 5 ? 1 : 0;
  if (max > 0 && levenshtein(g, a) <= max) return true;

  if (kind === "artist") {
    const tokens = a.split(" ").filter((token) => token.length >= 4);
    if (tokens.includes(g)) return true;
  }
  return false;
}

export function suggestNames(query: string, pool: readonly string[], limit = 8): string[] {
  const q = normalizeGuess(query);
  const compact = compactGuess(query);
  if (q.length < 2) return [];
  const scored: { raw: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const raw of pool) {
    if (!raw) continue;
    const key = normalizeGuess(raw);
    if (!key || seen.has(key)) continue;
    let score = 0;
    if (key === q) score = 100;
    else if (key.startsWith(q)) score = 86 - Math.min(20, key.length - q.length);
    else if (compact && compactGuess(raw).startsWith(compact)) score = 78;
    else if (key.includes(` ${q}`) || key.includes(q)) score = 54;
    else if (q.length >= 3) {
      const dist = levenshtein(key, q);
      if (dist <= (q.length >= 8 ? 2 : 1)) score = 42 - dist * 6;
    }
    if (score <= 0) continue;
    seen.add(key);
    scored.push({ raw, score });
  }
  scored.sort((a, b) => b.score - a.score || a.raw.localeCompare(b.raw, "de"));
  return scored.slice(0, limit).map((row) => row.raw);
}

export type NamePair = { title: string; artist: string };

function artistHintHits(hint: string, artist: string) {
  const q = normalizeGuess(hint);
  if (!q) return true;
  const a = normalizeGuess(artist);
  if (!a) return false;
  if (a === q || a.startsWith(q) || a.includes(` ${q}`) || a.includes(q)) return true;
  return guessMatches(hint, artist, "artist");
}

export function mergeNamePairs(groups: readonly NamePair[][]): NamePair[] {
  const seen = new Set<string>();
  const out: NamePair[] = [];
  for (const group of groups) {
    for (const row of group) {
      if (!row.title || !row.artist) continue;
      const key = `${normalizeGuess(row.title)}\0${normalizeGuess(row.artist)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

export function uniqueArtists(songs: readonly NamePair[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of songs) {
    const key = normalizeGuess(row.artist);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row.artist);
  }
  return out;
}

export function titlesForArtist(artistHint: string, songs: readonly NamePair[]): string[] {
  const hint = artistHint.trim();
  const rows = hint ? songs.filter((row) => artistHintHits(hint, row.artist)) : songs;
  const titles: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = normalizeGuess(row.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    titles.push(row.title);
  }
  return titles;
}

export function suggestTitles(
  query: string,
  artistHint: string,
  songs: readonly NamePair[],
  limit = 8,
): string[] {
  const hint = artistHint.trim();
  const titles = titlesForArtist(artistHint, songs);
  const typed = normalizeGuess(query);
  if (!typed) return hint ? titles.slice(0, limit) : [];
  return suggestNames(query, titles, limit);
}

export function kennerBonus(variant: PlayVariant, titleCorrect: boolean, artistCorrect: boolean) {
  return variant === "original" && titleCorrect && artistCorrect;
}

export function scoreForVariant(
  titleGuess: string,
  artistGuess: string,
  song: { title: string; artist: string },
  variant: PlayVariant,
  custom?: CustomRules,
) {
  const full = scoreGuesses(titleGuess, artistGuess, song);
  const kind = guessKind(variant, custom);
  if (kind === "both") return full;
  if (kind === "artist") {
    return {
      titleCorrect: false,
      artistCorrect: full.artistCorrect,
      quiz: full.artistCorrect ? 1 : 0,
    };
  }
  if (kind === "title") {
    return {
      titleCorrect: full.titleCorrect,
      artistCorrect: false,
      quiz: full.titleCorrect ? 1 : 0,
    };
  }
  return { titleCorrect: false, artistCorrect: false, quiz: 0 };
}

export function scoreGuesses(
  titleGuess: string,
  artistGuess: string,
  song: { title: string; artist: string },
) {
  const titleCorrect = guessMatches(titleGuess, song.title, "title");
  const artistCorrect = guessMatches(artistGuess, song.artist, "artist");
  return {
    titleCorrect,
    artistCorrect,
    quiz: Number(titleCorrect) + Number(artistCorrect),
  };
}
