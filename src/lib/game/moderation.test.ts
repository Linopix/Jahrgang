import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanMessage, cleanName, isBlocked, safeName } from "./moderation.ts";

test("blocks slurs even with spaces or leet", () => {
  assert.equal(isBlocked("neger"), true);
  assert.equal(isBlocked("N e g e r"), true);
  assert.equal(isBlocked("n1gga"), true);
  assert.equal(isBlocked("niqqa"), true);
  assert.equal(isBlocked("Hurensohn"), true);
  assert.equal(isBlocked("arschloch"), true);
  assert.equal(isBlocked("Kanake!!!"), true);
});

test("lets normal names and chat through", () => {
  assert.equal(isBlocked("Alex"), false);
  assert.equal(isBlocked("Nigel"), false);
  assert.equal(isBlocked("Klassiker"), false);
  assert.equal(isBlocked("Mo"), false);
  assert.equal(isBlocked("schweinebein"), false);
  assert.equal(isBlocked("hit hören"), false);
  assert.equal(cleanName("Sam"), "Sam");
  assert.equal(cleanMessage("wo liegt ihr?"), "wo liegt ihr?");
});

test("blocked names collapse to empty, messages do not send", () => {
  assert.equal(cleanName("Neger"), "");
  assert.equal(safeName("Neger", "Gast"), "Gast");
  assert.equal(cleanMessage("du hurensohn"), "");
  assert.equal(cleanMessage("  "), "");
});
