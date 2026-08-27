import assert from "node:assert/strict";
import { test } from "node:test";
import { SPOTIFY_LIVE } from "./flags.ts";
import { beginLogin, loopbackHost, originOf } from "./oauth.server.ts";

test("spotify stays off until the flag is flipped", () => {
  assert.equal(SPOTIFY_LIVE, false);
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    const login = beginLogin(new Request("http://127.0.0.1:8080/api/spotify/login"));
    assert.equal(login, null);
  }
});

test("loopback host rewrites localhost for Spotify redirect URIs", () => {
  assert.equal(loopbackHost("localhost"), "127.0.0.1");
  assert.equal(loopbackHost("localhost:8080"), "127.0.0.1:8080");
  assert.equal(loopbackHost("LOCALHOST:8080"), "127.0.0.1:8080");
  assert.equal(loopbackHost("127.0.0.1:8080"), "127.0.0.1:8080");
  assert.equal(loopbackHost("jahrgang.vercel.app"), "jahrgang.vercel.app");
});

test("originOf uses 127.0.0.1 instead of localhost", () => {
  const origin = originOf(
    new Request("http://localhost:8080/api/spotify/login", {
      headers: { host: "localhost:8080" },
    }),
  );
  assert.equal(origin, "http://127.0.0.1:8080");
  const live = originOf(
    new Request("https://jahrgang.vercel.app/api/spotify/login", {
      headers: { host: "jahrgang.vercel.app", "x-forwarded-proto": "https" },
    }),
  );
  assert.equal(live, "https://jahrgang.vercel.app");
});
