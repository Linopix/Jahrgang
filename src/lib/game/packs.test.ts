import assert from "node:assert/strict";
import { test } from "node:test";
import { songsForPack } from "./packs.ts";
import { ERA_IDS } from "./types.ts";

test("each playable pack has enough songs for a round", () => {
  for (const id of ERA_IDS) {
    if (id === "playlist") continue;
    const mix = { from: 1980, to: 2020, genre: "all" as const };
    const n = songsForPack(id, mix).length;
    assert.ok(n >= 12, `${id} only has ${n} songs`);
  }
});

test("tiktok packs are distinct curated kits", () => {
  const a = songsForPack("tiktok-2024");
  const b = songsForPack("tiktok-2025");
  assert.ok(a.some((s) => s.title === "Espresso"));
  assert.ok(b.some((s) => s.title === "Ordinary" || s.title === "APT."));
  assert.ok(b.length >= 20);
});

test("rap charts stays recent hip-hop", () => {
  const rows = songsForPack("rap-charts");
  assert.ok(rows.length >= 12);
  assert.ok(rows.every((s) => s.year >= 2015));
  assert.ok(rows.some((s) => s.artist === "Kendrick Lamar"));
});

test("mix respects year range and german genre", () => {
  const mix = songsForPack("mix", { from: 1980, to: 1980, genre: "german" });
  assert.ok(mix.length >= 4);
  assert.ok(mix.every((s) => s.year >= 1980 && s.year <= 1989 && s.german));
});
