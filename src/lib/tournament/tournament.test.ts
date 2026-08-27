import assert from "node:assert/strict";
import { test } from "node:test";
import { buildKnockout, nextPowerOfTwo, placeWinner } from "./bracket.ts";
import {
  applyBye,
  collectQualifiers,
  completeMatch,
  createTournament,
  cupPreview,
  liveMatches,
  nextPending,
  openKnockout,
  startBatch,
  startMatch,
  type MatchScore,
} from "./engine.ts";
import { planGroupSizes } from "./groups.ts";
import { parseTournament } from "./wire.ts";
import { TOURNAMENT_LIVE, TOURNAMENT_MODE_ENABLED } from "./flags.ts";

function people(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `S${i}` }));
}

test("feature flag alias matches TOURNAMENT_LIVE", () => {
  assert.equal(TOURNAMENT_MODE_ENABLED, TOURNAMENT_LIVE);
});

function scores(ids: string[]): MatchScore[] {
  return ids.map((id, i) => ({
    id,
    name: id,
    cards: 10 - i,
    quiz: 4 - i,
    misses: i,
  }));
}

test("group sizes for 20 to 30 stay 3 or 4 and sum to n", () => {
  for (let n = 4; n <= 32; n++) {
    const auto = planGroupSizes(n, "auto");
    const threes = planGroupSizes(n, 3);
    const fours = planGroupSizes(n, 4);
    assert.equal(auto.reduce((a, b) => a + b, 0), n, `auto ${n}`);
    assert.equal(threes.reduce((a, b) => a + b, 0), n, `3er ${n}`);
    assert.equal(fours.reduce((a, b) => a + b, 0), n, `4er ${n}`);
    assert.ok(auto.every((s) => s >= 2 && s <= 4), `auto sizes ${n}: ${auto}`);
  }
  assert.deepEqual(planGroupSizes(20, "auto"), [4, 4, 4, 4, 4]);
  assert.deepEqual(planGroupSizes(21, "auto"), [4, 4, 4, 3, 3, 3]);
  assert.deepEqual(planGroupSizes(22, "auto"), [4, 4, 4, 4, 3, 3]);
  assert.deepEqual(planGroupSizes(23, "auto"), [4, 4, 4, 4, 4, 3]);
  assert.deepEqual(planGroupSizes(30, "auto"), [4, 4, 4, 4, 4, 4, 3, 3]);
  assert.deepEqual(planGroupSizes(6, "auto"), [3, 3]);
  assert.deepEqual(planGroupSizes(8, 3), [4, 4]);
});

test("20 players: five groups of 4, top 2, knockout with byes", () => {
  const t0 = createTournament(people(20), { shuffle: (items) => items.slice() });
  assert.equal(t0.groups.length, 5);
  assert.ok(t0.groups.every((g) => g.playerIds.length === 4));
  let t = t0;
  for (const group of t0.groups) {
    const match = t.matches.find((row) => row.id === group.matchId);
    assert.ok(match);
    t = completeMatch(t, match!.id, scores(group.playerIds));
  }
  assert.equal(t.status, "knockout");
  const qualifiers = collectQualifiers(t);
  assert.equal(qualifiers.length, 10);
  const ko = t.matches.filter((row) => row.kind === "knockout");
  assert.ok(ko.some((row) => row.round === "r16"));
  assert.ok(ko.some((row) => row.round === "final"));
  const first = ko.filter((row) => row.round === "r16");
  const byes = first.filter((row) => row.bye);
  const live = first.filter((row) => !row.bye);
  assert.equal(byes.length + live.length * 2, 10);
});

test("single group of 4 ends as tournament result, no knockout", () => {
  let t = createTournament(people(4), { shuffle: (items) => items.slice() });
  assert.equal(t.groups.length, 1);
  const match = t.matches[0];
  assert.ok(match);
  t = completeMatch(t, match.id, scores(match.playerIds));
  assert.equal(t.status, "done");
  assert.equal(t.championId, match.playerIds[0]);
});

test("tie in a knockout match stays live as stechen", () => {
  let t = createTournament(people(4), { groupPref: 4, shuffle: (items) => items.slice() });
  t = {
    ...t,
    status: "knockout",
    groups: t.groups,
    matches: [
      {
        id: "k0",
        kind: "knockout",
        round: "final",
        playerIds: ["p0", "p1"],
        winnerIds: [],
        status: "live",
        bye: false,
        stechen: false,
      },
    ],
    currentMatchId: "k0",
  };
  t = completeMatch(t, "k0", [
    { id: "p0", name: "A", cards: 6, quiz: 2, misses: 1 },
    { id: "p1", name: "B", cards: 6, quiz: 2, misses: 1 },
  ]);
  const match = t.matches[0];
  assert.equal(match?.stechen, true);
  assert.equal(match?.status, "live");
  t = completeMatch(t, "k0", [
    { id: "p1", name: "B", cards: 3, quiz: 1, misses: 0 },
    { id: "p0", name: "A", cards: 2, quiz: 1, misses: 0 },
  ]);
  assert.equal(t.status, "done");
  assert.equal(t.championId, "p1");
});

test("bye match advances the remaining player", () => {
  const { matches } = buildKnockout(
    [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ],
    0,
  );
  const bye = matches.find((row) => row.bye);
  assert.ok(bye);
  let t = applyBye(
    {
      rev: 1,
      status: "knockout",
      groupPref: "auto",
      qualify: 2,
      players: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
        { id: "c", name: "C" },
      ],
      groups: [],
      matches,
      currentMatchId: bye!.id,
      championId: null,
    },
    bye!.id,
  );
  const parent = t.matches.find((row) => row.id === bye!.nextMatchId);
  assert.ok(parent?.playerIds.includes(bye!.playerIds[0]!));
});

test("next pending prefers remaining group matches", () => {
  const t = createTournament(people(8), { shuffle: (items) => items.slice() });
  const first = nextPending(t);
  assert.equal(first?.kind, "group");
  const after = startMatch(t, first!.id);
  assert.equal(after.currentMatchId, first!.id);
  assert.equal(after.matches.find((row) => row.id === first!.id)?.status, "live");
});

test("wire roundtrip keeps ids", () => {
  const t = createTournament(people(6), { shuffle: (items) => items.slice() });
  const parsed = parseTournament(JSON.parse(JSON.stringify(t)));
  assert.ok(parsed);
  assert.equal(parsed!.groups.length, 2);
  assert.equal(parsed!.players.length, 6);
});

test("knockout power of two and 10-into-16", () => {
  assert.equal(nextPowerOfTwo(10), 16);
  assert.equal(nextPowerOfTwo(8), 8);
  const { matches } = buildKnockout(people(10));
  const r16 = matches.filter((row) => row.round === "r16");
  assert.equal(r16.length, 8);
  assert.equal(r16.filter((row) => row.bye).length, 6);
  assert.equal(r16.filter((row) => !row.bye).length, 2);
});

test("placeWinner does not duplicate", () => {
  const matches = [
    {
      id: "a",
      kind: "knockout" as const,
      round: "sf" as const,
      playerIds: ["p0"],
      winnerIds: ["p0"],
      status: "done" as const,
      bye: true,
      stechen: false,
      nextMatchId: "f",
      nextSlot: 0 as const,
    },
    {
      id: "f",
      kind: "knockout" as const,
      round: "final" as const,
      playerIds: ["p0"],
      winnerIds: [],
      status: "pending" as const,
      bye: true,
      stechen: false,
    },
  ];
  const next = placeWinner(matches, "a", "p0");
  assert.deepEqual(next[1]?.playerIds, ["p0"]);
});

test("preview text for 20 and too few", () => {
  const text = cupPreview(20, "auto", 2);
  assert.match(text, /5 Gruppen/);
  assert.match(text, /Achtelfinale/);
  assert.match(cupPreview(2, "auto", 2), /Mindestens 4/);
});

test("openKnockout after groups of 6 yields semifinal", () => {
  let t = createTournament(people(6), { shuffle: (items) => items.slice() });
  for (const match of t.matches.filter((row) => row.kind === "group")) {
    t = completeMatch(t, match.id, scores(match.playerIds));
  }
  t = t.matches.some((row) => row.kind === "knockout") ? t : openKnockout(t);
  assert.equal(t.status, "knockout");
  assert.equal(collectQualifiers(t).length, 4);
  assert.ok(t.matches.some((row) => row.round === "sf"));
});

test("parallel batch keeps more than one match live", () => {
  let t = createTournament(people(8), { shuffle: (items) => items.slice() });
  t = startBatch(t, true);
  const live = liveMatches(t);
  assert.ok(live.length >= 2);
  assert.ok(live.every((row) => row.status === "live"));
  const seq = startBatch(createTournament(people(8), { shuffle: (items) => items.slice() }), false);
  assert.equal(liveMatches(seq).length, 1);
});
