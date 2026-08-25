import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlaylistInput, parseTrackLine, parseTrackList } from "./playlist-url.ts";

test("parses interpret – titel lines and optional year", () => {
  assert.deepEqual(parseTrackLine("Queen – Bohemian Rhapsody – 1975"), {
    artist: "Queen",
    title: "Bohemian Rhapsody",
    year: 1975,
  });
  assert.deepEqual(parseTrackLine("Nena - 99 Luftballons"), {
    artist: "Nena",
    title: "99 Luftballons",
    year: undefined,
  });
  assert.equal(parseTrackLine("# comment"), null);
});

test("parses a pasted list of at least four tracks", () => {
  const text = [
    "Queen – Bohemian Rhapsody – 1975",
    "ABBA – Dancing Queen – 1976",
    "Nena – 99 Luftballons – 1983",
    "a-ha – Take On Me – 1985",
  ].join("\n");
  const ref = parsePlaylistInput(text);
  assert.equal(ref?.source, "list");
  if (ref?.source === "list") assert.equal(ref.tracks.length, 4);
  assert.equal(parseTrackList(text).length, 4);
});

test("parses Deezer playlist links", () => {
  assert.deepEqual(
    parsePlaylistInput("https://www.deezer.com/de/playlist/908622995"),
    { source: "deezer", kind: "playlist", id: "908622995" },
  );
});

test("rejects spotify urls and empty input", () => {
  assert.equal(parsePlaylistInput("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"), null);
  assert.equal(parsePlaylistInput(""), null);
});
