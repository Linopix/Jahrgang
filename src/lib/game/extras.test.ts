import assert from "node:assert/strict";
import { test } from "node:test";
import { countFittingExtras, extraFitsPack, mergeExtraSongs } from "./extras.ts";
import { songFitsPack } from "./packs.ts";

const eighties = { id: "a", title: "Take On Me", artist: "a-ha", year: 1985 };
const today = { id: "b", title: "Espresso", artist: "Sabrina Carpenter", year: 2024 };
const catalog = [eighties];

test("library extras only enter packs they fit", () => {
  assert.equal(songFitsPack(today, "today"), true);
  assert.equal(songFitsPack(today, "eighties"), false);
  assert.equal(extraFitsPack(today, "eighties", null), false);
  assert.equal(extraFitsPack(today, "today", null), true);
  assert.equal(extraFitsPack(today, "eighties", "likes"), true);
});

test("merge puts new songs in front of the catalog pile", () => {
  const { pool, added } = mergeExtraSongs(catalog, [today, eighties], "all", null);
  assert.equal(added.length, 1);
  assert.equal(pool[0]?.id, "b");
  assert.equal(pool.length, 2);
});

test("fitting count skips songs already in the pack", () => {
  assert.equal(countFittingExtras([eighties, today], "all", null, undefined, new Set(["a"])), 1);
});
