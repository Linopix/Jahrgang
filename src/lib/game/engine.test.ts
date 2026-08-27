import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlace, cardsNeeded, cupPileStatus, dealCount, pileStatus, rankPlayers, songsFromBoard, turnsUntilFirstWin } from "./engine.ts";
import { DEFAULT_TARGET, DEFAULT_VARIANT, VARIANT_IDS, defaultTokensFor, parseEras, type Player } from "./types.ts";

test("kenner is first, zeitstrahl second, ten cards default", () => {
  assert.equal(VARIANT_IDS[0], "original");
  assert.equal(VARIANT_IDS[1], "timeline");
  assert.equal(DEFAULT_VARIANT, "original");
  assert.equal(DEFAULT_TARGET, 10);
  assert.equal(defaultTokensFor("original"), 0);
  assert.equal(defaultTokensFor("timeline"), 2);
});

test("pack list keeps order, drops duplicates, all stays alone", () => {
  assert.deepEqual(parseEras("eighties", "pop"), ["eighties", "pop"]);
  assert.deepEqual(parseEras("eighties", "pop", ["pop", "eighties", "rock"]), ["pop", "eighties", "rock"]);
  assert.deepEqual(parseEras("all", "pop"), ["all"]);
  assert.deepEqual(parseEras("eighties", "eighties"), ["eighties"]);
});

test("forward timeline rejects earlier year on the right", () => {
  const line = [{ year: 1980 }, { year: 2000 }];
  assert.equal(canPlace(line, 1, 1990), true);
  assert.equal(canPlace(line, 1, 1970), false);
  assert.equal(canPlace(line, 2, 2010), true);
  assert.equal(canPlace(line, 0, 1970), true);
  assert.equal(canPlace(line, 0, 1990), false);
});

test("wild reverse timeline wants later on the left", () => {
  const line = [{ year: 2000 }, { year: 1980 }];
  assert.equal(canPlace(line, 1, 1990, true), true);
  assert.equal(canPlace(line, 1, 2010, true), false);
  assert.equal(canPlace(line, 0, 2010, true), true);
  assert.equal(canPlace(line, 0, 1990, true), false);
  assert.equal(canPlace(line, 2, 1970, true), true);
});

test("four players at eight cards get a full race", () => {
  const n = cardsNeeded(4, 8, false);
  const play = n - 4;
  assert.equal(n, 36);
  assert.ok(play >= turnsUntilFirstWin(4, 8));
});

test("default ten cards is a longer race than eight", () => {
  assert.equal(cardsNeeded(4, 10, false), 44);
  assert.ok(cardsNeeded(4, 10, false) > cardsNeeded(4, 8, false));
  assert.ok(dealCount(4, 10, false) >= turnsUntilFirstWin(4, 10));
});

test("two players still have a short table", () => {
  const n = cardsNeeded(2, 8, false);
  assert.equal(n, 18);
  assert.ok(n - 2 >= turnsUntilFirstWin(2, 8));
});

test("open play asks for a decent pile, not the cap", () => {
  assert.equal(cardsNeeded(4, 8, true, 80), 24);
});

test("custom pool lifts an open round", () => {
  assert.equal(cardsNeeded(4, 8, true, 80, 48), 48);
  assert.equal(dealCount(4, 8, false, 48), 48);
  assert.equal(dealCount(4, 8, false), 36);
});

test("target sixteen needs more than ten", () => {
  assert.equal(cardsNeeded(4, 16, false), 68);
  assert.ok(dealCount(4, 16, false) > cardsNeeded(4, 10, false));
});

test("turns until first win is the first player's last extra", () => {
  assert.equal(turnsUntilFirstWin(4, 8), 25);
  assert.equal(turnsUntilFirstWin(4, 6), 17);
});

test("pile status flags a short pack for four at eight cards", () => {
  assert.equal(pileStatus(12, 4, 8, false), "short");
  assert.equal(pileStatus(36, 4, 8, false), "tight");
  assert.equal(pileStatus(40, 4, 8, false), "ok");
  assert.equal(pileStatus(0, 4, 8, false), "empty");
  assert.equal(pileStatus(null, 4, 8, false), "unknown");
  assert.equal(pileStatus(36, 4, 8, true, 48), "short");
  assert.equal(pileStatus(48, 4, 8, true, 48), "tight");
});

test("normal deal still caps at 80, cup pile does not", () => {
  assert.equal(dealCount(8, 16, false, 200), 80);
  assert.equal(cupPileStatus(200, 8), "ok");
});

test("songsFromBoard keeps unique titles from timelines and deck", () => {
  const a = { id: "a", title: "A", artist: "X", year: 1980, previewUrl: "a" };
  const b = { id: "b", title: "B", artist: "Y", year: 1981, previewUrl: "b" };
  const c = { id: "c", title: "C", artist: "Z", year: 1982, previewUrl: "c" };
  const pile = songsFromBoard(
    [
      { id: "p1", name: "Eins", timeline: [a], tokens: 0, misses: 0, quiz: 0 },
      { id: "p2", name: "Zwei", timeline: [a], tokens: 0, misses: 0, quiz: 0 },
    ],
    b,
    [c, b],
  );
  assert.deepEqual(
    pile.map((row) => row.id),
    ["a", "b", "c"],
  );
});

test("rank prefers more cards then more quiz hits", () => {
  const seat = (id: string, cards: number, quiz: number, misses: number): Player => ({
    id,
    name: id,
    timeline: Array.from({ length: cards }, (_, i) => ({
      id: `${id}-${i}`,
      title: id,
      artist: id,
      year: 1980 + i,
      previewUrl: "",
    })),
    tokens: 0,
    misses,
    quiz,
  });
  const ranked = rankPlayers([seat("a", 2, 0, 1), seat("b", 2, 3, 0), seat("c", 1, 9, 0)]);
  assert.deepEqual(
    ranked.map((row) => row.id),
    ["b", "a", "c"],
  );
});
