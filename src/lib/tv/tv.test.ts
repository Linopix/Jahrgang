import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_LIVE } from "./flags.ts";
import { pickSuccessor, skipClaim, takeClaim, TV_MODE_NAME, TV_STAGE_NAME } from "./names.ts";
import { encodeQr } from "../qr.ts";
import { invitePath, shareOrigin, shareUrl, wantsHostClaim } from "../game/room-code.ts";

test("bigscreen is live", () => {
  assert.equal(TV_LIVE, true);
  assert.equal(TV_MODE_NAME, "Bigscreen");
  assert.equal(TV_STAGE_NAME, "Bühne");
});

test("first phone can claim host", () => {
  const tv = "tv-1";
  const phone = "phone-1";
  const hit = takeClaim({
    claimOpen: true,
    tvId: tv,
    adminId: tv,
    from: phone,
  });
  assert.deepEqual(hit, {
    adminId: phone,
    claimOpen: false,
    tvStep: "setup",
    stagePlays: false,
  });
});

test("first phone claims even without host flag", () => {
  const hit = takeClaim({
    claimOpen: true,
    tvId: "tv-1",
    adminId: "tv-1",
    from: "phone-1",
  });
  assert.equal(hit?.adminId, "phone-1");
});

test("second phone cannot steal host", () => {
  const miss = takeClaim({
    claimOpen: false,
    tvId: "tv-1",
    adminId: "phone-1",
    from: "phone-2",
  });
  assert.equal(miss, null);
});

test("skip keeps the tv as admin and lets it play", () => {
  assert.deepEqual(skipClaim("tv-1"), {
    adminId: "tv-1",
    claimOpen: false,
    tvStep: "setup",
    stagePlays: true,
  });
});

test("successor prefers a live phone", () => {
  assert.equal(
    pickSuccessor(
      [
        { id: "tv", live: true },
        { id: "a", live: true },
        { id: "b", live: true },
      ],
      "a",
      "tv",
    ),
    "b",
  );
});

test("successor falls back to the tv", () => {
  assert.equal(
    pickSuccessor(
      [
        { id: "tv", live: true },
        { id: "a", live: false },
      ],
      "a",
      "tv",
    ),
    "tv",
  );
});

test("host link is marked", () => {
  assert.equal(wantsHostClaim("1"), true);
  assert.equal(wantsHostClaim("https://x.test/?room=K7P2&host=1"), true);
  assert.equal(wantsHostClaim("https://x.test/?room=K7P2"), false);
  assert.equal(shareUrl("K7P2", { host: true }).includes("host=1"), true);
  assert.equal(shareUrl("K7P2").includes("/i/K7P2"), true);
  assert.equal(shareUrl("K7P2").includes("host="), false);
  assert.equal(invitePath("K7P2", { host: true }), "/i/K7P2?host=1");
  assert.equal(
    shareUrl("K7P2", { host: true, origin: "https://jahrgang.vercel.app" }),
    "https://jahrgang.vercel.app/i/K7P2?host=1",
  );
  assert.equal(shareOrigin("https://abc.grok-sandbox.com/play"), "https://jahrgang.vercel.app");
  assert.equal(shareOrigin("https://jahrgang.vercel.app/x"), "https://jahrgang.vercel.app");
  assert.equal(shareOrigin("http://192.168.1.20:8080/"), "http://192.168.1.20:8080");
});

test("qr encodes the full invite url", () => {
  const url = "https://jahrgang.vercel.app/i/K7P2?host=1";
  const m = encodeQr(url);
  const n = m.length;
  assert.ok(n >= 25);
  assert.equal(n, m[0]?.length);
  const finder = (x0: number, y0: number) => {
    for (let x = 0; x < 7; x += 1) {
      assert.equal(m[y0]![x0 + x], true);
      assert.equal(m[y0 + 6]![x0 + x], true);
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  const long = encodeQr("https://jahrgang.vercel.app/i/K7P2?host=1&from=discord");
  assert.equal(long.length, long[0]?.length);
  assert.notEqual(
    JSON.stringify(encodeQr("https://jahrgang.vercel.app/i/AAAA")),
    JSON.stringify(encodeQr("https://jahrgang.vercel.app/i/BBBB")),
  );
});
