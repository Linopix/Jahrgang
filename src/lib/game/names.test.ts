import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeNamePairs } from "./guess.ts";
import { parseStageAudio, parseSuggest } from "./types.ts";
import { parseCupAudio, parseCupFlow } from "../tournament/types.ts";
import { hintLimit, hintQuery } from "./name-query.ts";

test("parseSuggest accepts on off loose", () => {
  assert.equal(parseSuggest("on"), "on");
  assert.equal(parseSuggest("off"), "off");
  assert.equal(parseSuggest("loose"), "loose");
  assert.equal(parseSuggest("nope"), "on");
});

test("parseStageAudio accepts stage and all", () => {
  assert.equal(parseStageAudio("stage"), "stage");
  assert.equal(parseStageAudio("all"), "all");
  assert.equal(parseStageAudio("nope"), "stage");
});

test("cup flow and audio defaults", () => {
  assert.equal(parseCupFlow("par"), "par");
  assert.equal(parseCupFlow("nope"), "seq");
  assert.equal(parseCupAudio("all", "seq"), "stage");
  assert.equal(parseCupAudio("all", "par"), "all");
  assert.equal(parseCupAudio("stage", "par"), "one");
});

test("name pairs drop empty rows", () => {
  const merged = mergeNamePairs([
    [{ title: "A", artist: "B" }, { title: "", artist: "B" }, { title: "A", artist: "B" }],
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.title, "A");
});

test("artist song query is not a single-hit prefix", () => {
  assert.equal(hintQuery("songs", "Ikkimel"), 'artist:"Ikkimel" AND status:official');
  assert.equal(hintQuery("artist", "Ikkimel"), "artist:Ikkimel*");
  assert.equal(hintQuery("title", "Kaviar"), "recording:Kaviar*");
  assert.equal(hintLimit("songs"), 100);
  assert.ok(hintLimit("title") > 8);
  assert.equal(hintQuery("songs", 'Ikk"imel'), 'artist:"Ikkimel" AND status:official');
});
