import { songFitsPack } from "./packs";
import type { CatalogSong, EraId, MixFilter } from "./types";

export type ExtraSong = CatalogSong & {
  previewUrl?: string;
  artworkUrl?: string;
};

export function extraFitsPacks(song: CatalogSong, packs: EraId[], mix?: MixFilter) {
  if (packs.includes("likes")) return true;
  for (const pack of packs) {
    if (pack === "playlist") return true;
    if (songFitsPack(song, pack, mix)) return true;
  }
  return false;
}

export function extraFitsPack(
  song: CatalogSong,
  pack: EraId,
  extra: EraId | null | undefined,
  mix?: MixFilter,
) {
  return extraFitsPacks(song, extra ? [pack, extra] : [pack], mix);
}

export function mergeExtraSongs(
  catalog: CatalogSong[],
  extras: ExtraSong[],
  pack: EraId,
  extra: EraId | null | undefined,
  mix?: MixFilter,
) {
  return mergeExtraSongsFor(catalog, extras, extra ? [pack, extra] : [pack], mix);
}

export function mergeExtraSongsFor(
  catalog: CatalogSong[],
  extras: ExtraSong[],
  packs: EraId[],
  mix?: MixFilter,
) {
  const seen = new Set(catalog.map((song) => song.id));
  const added: ExtraSong[] = [];
  for (const song of extras) {
    if (!song.id || seen.has(song.id)) continue;
    if (!extraFitsPacks(song, packs, mix)) continue;
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
  return countFittingFor(extras, extra ? [pack, extra] : [pack], mix, knownIds);
}

export function countFittingFor(
  extras: CatalogSong[],
  packs: EraId[],
  mix?: MixFilter,
  knownIds?: Set<string>,
) {
  const seen = knownIds ?? new Set<string>();
  let n = 0;
  for (const song of extras) {
    if (!song.id || seen.has(song.id)) continue;
    if (!extraFitsPacks(song, packs, mix)) continue;
    seen.add(song.id);
    n += 1;
  }
  return n;
}
