import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeNamePairs } from "./guess.ts";
import { parseSuggest } from "./types.ts";

test("parseSuggest accepts on off loose", () => {
  assert.equal(parseSuggest("on"), "on");
  assert.equal(parseSuggest("off"), "off");
  assert.equal(parseSuggest("loose"), "loose");
  assert.equal(parseSuggest("nope"), "on");
});

test("name pairs drop empty rows", () => {
  const merged = mergeNamePairs([
    [{ title: "A", artist: "B" }, { title: "", artist: "B" }, { title: "A", artist: "B" }],
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.title, "A");
});
