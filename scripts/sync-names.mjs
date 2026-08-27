#!/usr/bin/env node
/**
 * Holt Interpret/Titel-Paare von MusicBrainz und schreibt
 * src/lib/game/names-data.json. Einmal pro Tag reicht (MusicBrainz: 1 Anfrage/s).
 *
 *   npm run sync:names
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const UA = "Jahrgang/1.0 (jahrgang.game@icloud.com)";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/game/names-data.json");

const QUERIES = [
  "tag:pop AND firstreleasedate:[1980 TO 1989] AND status:official",
  "tag:rock AND firstreleasedate:[1970 TO 1979] AND status:official",
  "tag:hip-hop AND firstreleasedate:[2010 TO 2026] AND status:official",
  "tag:electronic AND firstreleasedate:[1990 TO 1999] AND status:official",
  "tag:soul AND firstreleasedate:[1960 TO 1979] AND status:official",
  "firstreleasedate:[2020 TO 2026] AND status:official",
];

function pairOf(row) {
  const title = String(row?.title ?? "").trim();
  const artist = String(row?.["artist-credit"]?.[0]?.name ?? row?.["artist-credit"]?.[0]?.artist?.name ?? "").trim();
  if (!title || !artist) return null;
  return { title, artist };
}

async function fetchQuery(query) {
  const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&fmt=json&limit=80`;
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${query}`);
  const json = await res.json();
  return Array.isArray(json.recordings) ? json.recordings.flatMap((row) => {
    const pair = pairOf(row);
    return pair ? [pair] : [];
  }) : [];
}

function key(row) {
  return `${row.artist.toLowerCase()}\0${row.title.toLowerCase()}`;
}

async function main() {
  const seen = new Set();
  const out = [];
  for (const query of QUERIES) {
    const rows = await fetchQuery(query);
    for (const row of rows) {
      const id = key(row);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(row);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`sync-names: ${out.length} Einträge nach src/lib/game/names-data.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
