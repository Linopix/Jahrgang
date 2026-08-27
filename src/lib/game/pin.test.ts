import assert from "node:assert/strict";
import { test } from "node:test";
import { makePin, normalizePin, PIN_LEN, pinMatch, pinReady, ROOM_PIN_LIVE } from "./pin.ts";

test("pin is four digits", () => {
  assert.equal(PIN_LEN, 4);
  assert.equal(normalizePin("12ab34"), "1234");
  assert.equal(normalizePin("9 8 7 6 5"), "9876");
  assert.equal(pinReady("1234"), true);
  assert.equal(pinReady("12"), false);
});

test("empty host pin lets anyone in", () => {
  assert.equal(pinMatch("0000", ""), true);
  assert.equal(pinMatch("", ""), true);
});

test("set pin must match", () => {
  if (!ROOM_PIN_LIVE) return;
  assert.equal(pinMatch("1234", "1234"), true);
  assert.equal(pinMatch("123", "1234"), false);
  assert.equal(pinMatch("0000", "1234"), false);
});

test("makePin yields four digits", () => {
  const pin = makePin();
  assert.equal(pin.length, PIN_LEN);
  assert.match(pin, /^\d{4}$/);
});
