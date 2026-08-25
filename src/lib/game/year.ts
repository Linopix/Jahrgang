function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMatch(artist: string, title: string, foundArtist: string, foundTitle: string) {
  const a = fold(artist);
  const t = fold(title);
  const fa = fold(foundArtist);
  const ft = fold(foundTitle);
  let score = 0;
  if (fa === a) score += 4;
  else if (fa.includes(a) || a.includes(fa)) score += 3;
  if (ft === t) score += 4;
  else if (ft.includes(t) || t.includes(ft)) score += 3;
  return score;
}

type ITunesSong = {
  artistName?: string;
  trackName?: string;
  releaseDate?: string;
};

/** Store metadata only — never reads or returns preview audio or artwork. */
export async function lookupYear(title: string, artist: string): Promise<number | null> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: ITunesSong[] };
  const ranked = (json.results ?? [])
    .map((row) => ({
      row,
      score: scoreMatch(artist, title, row.artistName ?? "", row.trackName ?? ""),
    }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 5 || !best.row.releaseDate) return null;
  const year = new Date(best.row.releaseDate).getFullYear();
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isFinite(year) || year < 1950 || year > maxYear) return null;
  return year;
}
