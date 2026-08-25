import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlaylistUrl } from "./playlist-url.ts";

test("parses Spotify playlist, album and intl links", () => {
  assert.deepEqual(
    parsePlaylistUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc"),
    { source: "spotify", kind: "playlist", id: "37i9dQZF1DXcBWIGoYBM5M" },
  );
  assert.deepEqual(
    parsePlaylistUrl("https://open.spotify.com/intl-de/album/4aawyAB9vmqN3uQ7FjRGTy"),
    { source: "spotify", kind: "album", id: "4aawyAB9vmqN3uQ7FjRGTy" },
  );
  assert.deepEqual(
    parsePlaylistUrl("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"),
    { source: "spotify", kind: "playlist", id: "37i9dQZF1DXcBWIGoYBM5M" },
  );
});

test("parses Deezer playlist links", () => {
  assert.deepEqual(
    parsePlaylistUrl("https://www.deezer.com/de/playlist/908622995"),
    { source: "deezer", kind: "playlist", id: "908622995" },
  );
});

test("rejects unknown urls", () => {
  assert.equal(parsePlaylistUrl("https://youtube.com/playlist?list=x"), null);
  assert.equal(parsePlaylistUrl(""), null);
});
