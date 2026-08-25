import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlaylistInput, parsePlaylistUrl, parseTrackLine } from "./playlist-url.ts";

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

test("parses interpret – titel lists", () => {
  assert.deepEqual(parseTrackLine("Queen – Bohemian Rhapsody – 1975"), {
    artist: "Queen",
    title: "Bohemian Rhapsody",
    year: 1975,
  });
  const text = [
    "Queen – Bohemian Rhapsody – 1975",
    "ABBA – Dancing Queen – 1976",
    "Nena – 99 Luftballons – 1983",
    "a-ha – Take On Me – 1985",
  ].join("\n");
  const ref = parsePlaylistInput(text);
  assert.equal(ref?.source, "list");
});

test("rejects unknown urls", () => {
  assert.equal(parsePlaylistUrl("https://youtube.com/playlist?list=x"), null);
  assert.equal(parsePlaylistUrl(""), null);
});
