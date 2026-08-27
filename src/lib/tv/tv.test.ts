import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_LIVE } from "./flags.ts";

test("tv evening can be switched on", () => {
  assert.equal(TV_LIVE, true);
});
