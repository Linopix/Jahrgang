import assert from "node:assert/strict";
import { test } from "node:test";
import { freshSongsFromHits, parseDeezerChart, parseItunesChart } from "./fresh.ts";

test("itunes marketing feed becomes songs", () => {
  const hits = parseItunesChart({
    feed: {
      results: [
        { name: "Espresso", artistName: "Sabrina Carpenter", releaseDate: "2024-04-12" },
        { name: "Espresso", artistName: "Sabrina Carpenter", releaseDate: "2024-04-12" },
      ],
    },
  });
  const songs = freshSongsFromHits(hits);
  assert.equal(songs.length, 1);
  assert.equal(songs[0]?.title, "Espresso");
  assert.equal(songs[0]?.year, 2024);
});

test("deezer chart keeps preview and year", () => {
  const hits = parseDeezerChart({
    data: [
      {
        title: "Apt.",
        artist: { name: "ROSÉ" },
        album: { release_date: "2024-10-18", cover_medium: "https://x/a.jpg" },
        preview: "https://x/p.mp3",
      },
    ],
  });
  assert.equal(hits[0]?.year, 2024);
  assert.ok(hits[0]?.previewUrl);
});
