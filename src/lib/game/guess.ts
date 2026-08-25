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

export function suggestNames(query: string, pool: readonly string[], limit = 5): string[] {
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

export function scoreForVariant(
  titleGuess: string,
  artistGuess: string,
  song: { title: string; artist: string },
  variant: "timeline" | "blind" | "original" | "star" | "hook",
) {
  const full = scoreGuesses(titleGuess, artistGuess, song);
  if (variant === "original") return full;
  if (variant === "star") {
    return {
      titleCorrect: false,
      artistCorrect: full.artistCorrect,
      quiz: full.artistCorrect ? 1 : 0,
    };
  }
  if (variant === "hook") {
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
