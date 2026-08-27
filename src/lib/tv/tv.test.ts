import assert from "node:assert/strict";
import { test } from "node:test";
import { TV_LIVE } from "./flags.ts";
import { skipClaim, takeClaim, TV_MODE_NAME, TV_STAGE_NAME } from "./names.ts";
import { encodeQr } from "../qr.ts";
import { shareUrl, wantsHostClaim } from "../game/room-code.ts";

test("wohnzimmer is live", () => {
  assert.equal(TV_LIVE, true);
  assert.equal(TV_MODE_NAME, "Wohnzimmer");
  assert.equal(TV_STAGE_NAME, "Fernseher");
});

test("first phone can claim host", () => {
  const tv = "tv-1";
  const phone = "phone-1";
  const hit = takeClaim({
    claimOpen: true,
    wantsClaim: true,
    tvId: tv,
    adminId: tv,
    from: phone,
  });
  assert.deepEqual(hit, { adminId: phone, claimOpen: false, tvStep: "setup" });
});

test("second phone cannot steal host", () => {
  const miss = takeClaim({
    claimOpen: false,
    wantsClaim: true,
    tvId: "tv-1",
    adminId: "phone-1",
    from: "phone-2",
  });
  assert.equal(miss, null);
});

test("skip keeps the tv as admin", () => {
  assert.deepEqual(skipClaim("tv-1"), { adminId: "tv-1", claimOpen: false, tvStep: "setup" });
});

test("host link is marked", () => {
  assert.equal(wantsHostClaim("1"), true);
  assert.equal(wantsHostClaim("https://x.test/?room=K7P2&host=1"), true);
  assert.equal(wantsHostClaim("https://x.test/?room=K7P2"), false);
  assert.equal(shareUrl("K7P2", { host: true }).includes("host=1"), true);
  assert.equal(shareUrl("K7P2").includes("host="), false);
});

test("qr has finder patterns", () => {
  const m = encodeQr("https://jahrgang.vercel.app/?room=K7P2&host=1");
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
});
