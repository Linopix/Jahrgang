import { songFitsPack } from "./packs";
import type { CatalogSong, EraId, MixFilter } from "./types";

export type ExtraSong = CatalogSong & {
  previewUrl?: string;
  artworkUrl?: string;
};

export function extraFitsPack(
  song: CatalogSong,
  pack: EraId,
  extra: EraId | null | undefined,
  mix?: MixFilter,
) {
  if (pack === "likes" || extra === "likes") return true;
  if (songFitsPack(song, pack, mix)) return true;
  if (extra && extra !== pack) return songFitsPack(song, extra, mix);
  return false;
}

export function mergeExtraSongs(
  catalog: CatalogSong[],
  extras: ExtraSong[],
  pack: EraId,
  extra: EraId | null | undefined,
  mix?: MixFilter,
) {
  const seen = new Set(catalog.map((song) => song.id));
  const added: ExtraSong[] = [];
  for (const song of extras) {
    if (!song.id || seen.has(song.id)) continue;
    if (!extraFitsPack(song, pack, extra, mix)) continue;
    seen.add(song.id);
    added.push(song);
  }
  return { pool: [...added, ...catalog], added };
}

export function countFittingExtras(
  extras: CatalogSong[],
  pack: EraId,
  extra: EraId | null | undefined,
  mix?: MixFilter,
  knownIds?: Set<string>,
) {
  const seen = knownIds ?? new Set<string>();
  let n = 0;
  for (const song of extras) {
    if (!song.id || seen.has(song.id)) continue;
    if (!extraFitsPack(song, pack, extra, mix)) continue;
    seen.add(song.id);
    n += 1;
  }
  return n;
}
