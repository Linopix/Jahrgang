import assert from "node:assert/strict";
import { test } from "node:test";
import { guessMatches, normalizeGuess, scoreGuesses } from "./guess.ts";

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
