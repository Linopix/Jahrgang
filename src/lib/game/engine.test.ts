import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlace } from "./engine.ts";

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
