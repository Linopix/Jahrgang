import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlace, cardsNeeded, pileStatus, turnsUntilFirstWin } from "./engine.ts";

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

test("four players at default target get a full race", () => {
  const n = cardsNeeded(4, 8, false);
  const play = n - 4;
  assert.equal(n, 36);
  assert.ok(play >= turnsUntilFirstWin(4, 8));
});

test("two players still have a short table", () => {
  const n = cardsNeeded(2, 8, false);
  assert.equal(n, 18);
  assert.ok(n - 2 >= turnsUntilFirstWin(2, 8));
});

test("open play asks for a decent pile, not the cap", () => {
  assert.equal(cardsNeeded(4, 8, true, 80), 24);
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
});
