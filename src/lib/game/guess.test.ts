import assert from "node:assert/strict";
import { test } from "node:test";
import { guessMatches, kennerBonus, normalizeGuess, scoreGuesses, suggestNames, suggestTitles, titlesForArtist, uniqueArtists } from "./guess.ts";

test("normalize strips punctuation, articles and featuring", () => {
  assert.equal(normalizeGuess("Y.M.C.A."), "y m c a");
  assert.equal(normalizeGuess("The Beatles"), "beatles");
  assert.equal(normalizeGuess("Don't Stop Believin'"), "dont stop believin");
  assert.equal(normalizeGuess("Another Brick in the Wall, Pt. 2"), "another brick in wall");
  assert.equal(normalizeGuess("Song (feat. Someone)"), "song");
});

test("titles match with typos, acronyms and parentheticals", () => {
  assert.equal(guessMatches("Billie Jean", "Billie Jean"), true);
  assert.equal(guessMatches("billy jean", "Billie Jean"), true);
  assert.equal(guessMatches("Satisfaction", "(I Can't Get No) Satisfaction"), true);
  assert.equal(guessMatches("ymca", "Y.M.C.A."), true);
  assert.equal(guessMatches("Don't Stop Believing", "Don't Stop Believin'"), true);
  assert.equal(guessMatches("another brick in the wall", "Another Brick in the Wall, Pt. 2"), true);
  assert.equal(guessMatches("99 luftballons", "99 Luftballons"), true);
  assert.equal(guessMatches("Queen", "Dancing Queen"), false);
  assert.equal(guessMatches("love", "Whole Lotta Love"), false);
  assert.equal(guessMatches("", "Hello"), false);
});

test("artists match common short forms", () => {
  assert.equal(guessMatches("jackson", "Michael Jackson", "artist"), true);
  assert.equal(guessMatches("beatles", "The Beatles", "artist"), true);
  assert.equal(guessMatches("nena", "Nena", "artist"), true);
  assert.equal(guessMatches("chili peppers", "Red Hot Chili Peppers", "artist"), true);
  assert.equal(guessMatches("u2", "U2", "artist"), true);
  assert.equal(guessMatches("xxxx", "Queen", "artist"), false);
});

test("scoreGuesses awards one point each", () => {
  const song = { title: "Take On Me", artist: "a-ha" };
  assert.deepEqual(scoreGuesses("take on me", "aha", song), {
    titleCorrect: true,
    artistCorrect: true,
    quiz: 2,
  });
  assert.deepEqual(scoreGuesses("wrong", "a-ha", song), {
    titleCorrect: false,
    artistCorrect: true,
    quiz: 1,
  });
});

test("suggestNames fixes light typos and prefixes", () => {
  const pool = ["Bohemian Rhapsody", "Billie Jean", "Blinding Lights", "The Beatles"];
  const titles = suggestNames("bohem", pool);
  assert.ok(titles.includes("Bohemian Rhapsody"));
  const typo = suggestNames("billy jean", ["Billie Jean", "Beat It"]);
  assert.equal(typo[0], "Billie Jean");
  assert.deepEqual(suggestNames("x", pool), []);
});

test("title suggestions follow the typed artist even if it is wrong", () => {
  const songs = [
    { title: "Billie Jean", artist: "Michael Jackson" },
    { title: "Beat It", artist: "Michael Jackson" },
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Obscure Cut", artist: "Playlist Only" },
  ];
  const jackson = titlesForArtist("jackson", songs);
  assert.ok(jackson.includes("Billie Jean"));
  assert.ok(jackson.includes("Beat It"));
  assert.equal(jackson.includes("Bohemian Rhapsody"), false);
  const queen = suggestTitles("boh", "Queen", songs);
  assert.deepEqual(queen, ["Bohemian Rhapsody"]);
  const idle = suggestTitles("", "michael jackson", songs);
  assert.ok(idle.includes("Beat It"));
  assert.ok(idle.includes("Billie Jean"));
  assert.equal(idle.length, 2);
  assert.ok(titlesForArtist("", songs).includes("Obscure Cut"));
  assert.deepEqual(suggestTitles("boh", "Queen", songs, 8, "loose"), ["Bohemian Rhapsody"]);
  assert.deepEqual(suggestTitles("boh", "Queen", songs, 8, "off"), []);
  const extra = uniqueArtists(songs, ["Queen", "Daft Punk"]);
  assert.ok(extra.includes("Daft Punk"));
  assert.equal(extra.filter((name) => name === "Queen").length, 1);
});

test("kenner bonus needs both hits", () => {
  assert.equal(kennerBonus("original", true, true), true);
  assert.equal(kennerBonus("original", true, false), false);
  assert.equal(kennerBonus("wild", true, true), false);
  assert.equal(kennerBonus("timeline", true, true), false);
});
