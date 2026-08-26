import assert from "node:assert/strict";
import { test } from "node:test";
import { inferGenre, songsForPack, songsForPacks } from "./packs.ts";
import { ERA_IDS, GENRE_IDS } from "./types.ts";

test("each playable pack has enough songs for a round", () => {
  for (const id of ERA_IDS) {
    if (id === "playlist" || id === "likes") continue;
    const mix = { from: 1980, to: 2020, genre: "all" as const };
    const n = songsForPack(id, mix).length;
    const min = ["soul", "metal", "indie", "latin", "schlager"].includes(id) ? 8 : 12;
    assert.ok(n >= min, `${id} only has ${n} songs`);
  }
});

test("rap charts stays recent hip-hop", () => {
  const rows = songsForPack("rap-charts");
  assert.ok(rows.length >= 12);
  assert.ok(rows.every((s) => s.year >= 2015));
  assert.ok(rows.some((s) => s.artist === "Kendrick Lamar"));
});

test("mix respects year range and german genre", () => {
  const mix = songsForPack("mix", { from: 1980, to: 1989, genre: "german" });
  assert.ok(mix.length >= 4);
  assert.ok(mix.every((s) => s.year >= 1980 && s.year <= 1989 && s.german));
});

test("each mix genre has a playable pile", () => {
  for (const genre of GENRE_IDS) {
    if (genre === "all") continue;
    const rows = songsForPack("mix", { from: 1960, to: 2026, genre });
    assert.ok(rows.length >= 6, `${genre} only has ${rows.length} songs`);
  }
});

test("inferGenre splits metal soul and schlager", () => {
  assert.equal(inferGenre("Metallica"), "metal");
  assert.equal(inferGenre("Aretha Franklin"), "soul");
  assert.equal(inferGenre("Helene Fischer", true), "schlager");
  assert.equal(inferGenre("Shakira"), "latin");
  assert.equal(inferGenre("The Killers"), "indie");
  assert.equal(inferGenre("Usher"), "soul");
});

test("second pack adds unique titles", () => {
  const metal = songsForPack("metal");
  const both = songsForPacks("metal", "all");
  assert.ok(both.length > metal.length);
  assert.equal(both.length, new Set(both.map((song) => song.id)).size);
});
