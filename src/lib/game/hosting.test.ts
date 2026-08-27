import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptsHostTake, fromControl, fromHost, nextHostId, shouldTakeHost } from "./hosting.ts";

test("next host skips the leaving one and prefers a live phone over the TV", () => {
  assert.equal(
    nextHostId(
      [
        { id: "tv", live: true },
        { id: "a", live: true },
        { id: "b", live: true },
      ],
      "tv",
      "tv",
    ),
    "a",
  );
  assert.equal(
    nextHostId(
      [
        { id: "host", live: false },
        { id: "a", live: true },
        { id: "b", live: true },
      ],
      "host",
    ),
    "a",
  );
});

test("only the successor takes the host seat", () => {
  const members = [
    { id: "host", live: false },
    { id: "a", live: true },
    { id: "b", live: true },
  ];
  assert.equal(
    shouldTakeHost({ selfId: "a", hostId: "host", hostLive: false, members }),
    true,
  );
  assert.equal(
    shouldTakeHost({ selfId: "b", hostId: "host", hostLive: false, members }),
    false,
  );
  assert.equal(
    shouldTakeHost({ selfId: "a", hostId: "host", hostLive: true, members }),
    false,
  );
});

test("game state only from the mesh host", () => {
  assert.equal(fromHost("host", "host"), true);
  assert.equal(fromHost("guest", "host"), false);
  assert.equal(fromHost("", "host"), false);
  assert.equal(fromControl("admin", "host", "admin"), true);
  assert.equal(fromControl("guest", "host", "admin"), false);
});

test("host-take is ignored unless the sender is the successor", () => {
  const members = [
    { id: "host", live: false },
    { id: "a", live: true },
    { id: "b", live: true },
  ];
  assert.equal(
    acceptsHostTake({ from: "a", claimedId: "a", hostId: "host", hostLive: false, members }),
    true,
  );
  assert.equal(
    acceptsHostTake({ from: "b", claimedId: "b", hostId: "host", hostLive: false, members }),
    false,
  );
  assert.equal(
    acceptsHostTake({ from: "b", claimedId: "a", hostId: "host", hostLive: false, members }),
    false,
  );
  assert.equal(
    acceptsHostTake({ from: "a", claimedId: "a", hostId: "host", hostLive: true, members }),
    false,
  );
});
