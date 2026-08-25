import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_LIVE } from "./flags.ts";
import { isTvRoom, playerSeats } from "./mode.ts";

test("tv mode stays off until the flag is flipped", () => {
  assert.equal(TV_LIVE, false);
  assert.equal(isTvRoom(true), false);
  const seats = playerSeats(
    [
      { id: "host", name: "TV", connectionState: "self" },
      { id: "p1", name: "Anna", connectionState: "connected" },
    ],
    "host",
    true,
  );
  assert.equal(seats.length, 2);
  assert.equal(seats[0]?.id, "host");
});
