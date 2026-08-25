import assert from "node:assert/strict";
import { test } from "node:test";
import { SPOTIFY_LIVE } from "./flags.ts";
import { searchSpotifyPreview } from "./preview.server.ts";
import { beginLogin } from "./oauth.server.ts";

test("spotify stays off until the flag is flipped", async () => {
  assert.equal(SPOTIFY_LIVE, false);
  const hit = await searchSpotifyPreview({
    id: "x",
    title: "Hello",
    artist: "Adele",
    year: 2015,
  });
  assert.equal(hit, null);
  const login = beginLogin(new Request("http://localhost:8080/api/spotify/login"));
  assert.equal(login, null);
});
