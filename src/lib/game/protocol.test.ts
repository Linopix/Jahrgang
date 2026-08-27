import assert from "node:assert/strict";
import { test } from "node:test";
import { isOnlineMessage } from "./protocol.ts";

test("aim is a live placement message", () => {
  assert.equal(isOnlineMessage({ t: "aim", slot: 2 }), true);
  assert.equal(isOnlineMessage({ t: "aim", slot: null }), true);
  assert.equal(isOnlineMessage({ t: "aim" }), true);
  assert.equal(isOnlineMessage({ t: "nope", slot: 1 }), false);
});

test("host can delete chat lines", () => {
  assert.equal(isOnlineMessage({ t: "chat", text: "hi", id: "a1" }), true);
  assert.equal(isOnlineMessage({ t: "chat-del", id: "a1" }), true);
});

test("host succession and evening messages", () => {
  assert.equal(isOnlineMessage({ t: "host-take", hostId: "p-ab" }), true);
  assert.equal(isOnlineMessage({ t: "sync-request" }), true);
  assert.equal(isOnlineMessage({ t: "evening" }), true);
  assert.equal(isOnlineMessage({ t: "hello", name: "Ada", resume: true }), true);
});

test("cup state is a protocol message", () => {
  assert.equal(isOnlineMessage({ t: "cup", tournament: null }), true);
});


