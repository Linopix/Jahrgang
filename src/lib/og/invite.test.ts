import assert from "node:assert/strict";
import { test } from "node:test";
import { inviteCode, invitePng, inviteSvg, invitePageUrl, ogImageUrl, ogMeta } from "./invite.ts";

test("invite code keeps four letters", () => {
  assert.equal(inviteCode("ab-12"), "AB12");
  assert.equal(inviteCode("no"), "");
});

test("png starts with a signature and is wide enough", () => {
  const png = invitePng("K7P2");
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
  assert.equal(png[2], 0x4e);
  assert.equal(png[3], 0x47);
  assert.ok(png.length > 8_000);
});

test("svg carries the room code", () => {
  const svg = inviteSvg("K7P2");
  assert.match(svg, /K7P2/);
  assert.match(svg, /EINLADUNG/);
});

test("og meta uses banner for the site and a unique card for invites", () => {
  const home = ogMeta();
  assert.equal(ogImageUrl(), "https://jahrgang.vercel.app/og.jpg");
  assert.ok(home.some((row) => "property" in row && row.property === "og:image" && row.content === "https://jahrgang.vercel.app/og.jpg"));
  assert.ok(home.some((row) => "property" in row && row.property === "og:image:type" && row.content === "image/jpeg"));

  const meta = ogMeta("K7P2");
  assert.equal(ogImageUrl("K7P2"), "https://jahrgang.vercel.app/api/og?room=K7P2");
  assert.equal(invitePageUrl("K7P2"), "https://jahrgang.vercel.app/i/K7P2");
  assert.ok(meta.some((row) => "property" in row && row.property === "og:title" && row.content === "Jahrgang · Einladung K7P2"));
  assert.ok(meta.some((row) => "property" in row && row.property === "og:image" && row.content?.includes("room=K7P2")));
  assert.ok(meta.some((row) => "property" in row && row.property === "og:url" && row.content === "https://jahrgang.vercel.app/i/K7P2"));
});
