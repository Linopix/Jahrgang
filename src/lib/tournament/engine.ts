import { fisherYates } from "../game/engine.ts";
import { CUP_MIN } from "./flags.ts";
import { buildKnockout, nextKnockoutRound, placeWinner } from "./bracket.ts";
import { groupLabel, planGroupSizes, splitBySizes } from "./groups.ts";
import {
  emptyStanding,
  type CupConfig,
  type CupGroup,
  type CupGroupSize,
  type CupMatch,
  type CupPlayer,
  type CupQualify,
  type CupStanding,
  type Tournament,
} from "./types.ts";

export type MatchScore = {
  id: string;
  name: string;
  cards: number;
  quiz: number;
  misses: number;
};

export function createTournament(
  players: CupPlayer[],
  opts: { groupPref?: CupGroupSize; qualify?: CupQualify; shuffle?: <T>(items: T[]) => T[] } = {},
): Tournament {
  const shuffle = opts.shuffle ?? fisherYates;
  const groupPref = opts.groupPref ?? "auto";
  const qualify = opts.qualify ?? 2;
  const list = shuffle(players.filter((row) => row.id));
  const sizes = planGroupSizes(list.length, groupPref);
  const chunks = splitBySizes(list, sizes);
  const groups: CupGroup[] = [];
  const matches: CupMatch[] = [];
  chunks.forEach((chunk, i) => {
    const id = `g${i}`;
    const matchId = `m${i}`;
    groups.push({
      id,
      label: groupLabel(i),
      playerIds: chunk.map((row) => row.id),
      table: chunk.map((row) => emptyStanding(row)),
      matchId,
    });
    matches.push({
      id: matchId,
      kind: "group",
      round: "group",
      groupId: id,
      playerIds: chunk.map((row) => row.id),
      winnerIds: [],
      status: "pending",
      bye: chunk.length < 2,
      stechen: false,
    });
  });
  const onlyOne = groups.length <= 1;
  return {
    rev: 1,
    status: onlyOne ? "groups" : "groups",
    groupPref,
    qualify,
    players: list,
    groups,
    matches,
    currentMatchId: null,
    championId: null,
  };
}

export function currentMatch(t: Tournament | null): CupMatch | null {
  if (!t?.matches?.length) return null;
  const live = t.matches.find((row) => row.status === "live");
  if (live) return live;
  if (!t.currentMatchId) return null;
  return t.matches.find((row) => row.id === t.currentMatchId) ?? null;
}

export function liveMatches(t: Tournament | null): CupMatch[] {
  if (!t?.matches?.length) return [];
  return t.matches.filter((row) => row.status === "live");
}

export function matchOfPlayer(t: Tournament | null, playerId: string): CupMatch | null {
  if (!t?.matches?.length || !playerId) return null;
  return (
    t.matches.find((row) => row.status === "live" && row.playerIds?.includes(playerId)) ??
    t.matches.find((row) => row.playerIds?.includes(playerId) && row.status !== "done") ??
    null
  );
}

export function nextPending(t: Tournament): CupMatch | null {
  if (!t?.matches?.length) return null;
  const live = t.matches.find((row) => row.status === "live");
  if (live) return live;
  const groupOpen = t.matches.find((row) => row.kind === "group" && row.status !== "done");
  if (t.status === "groups" || groupOpen) {
    return t.matches.find((row) => row.kind === "group" && row.status === "pending") ?? null;
  }
  return t.matches.find((row) => row.kind === "knockout" && row.status === "pending") ?? null;
}

export function pendingBatch(t: Tournament): CupMatch[] {
  if (!t?.matches?.length) return [];
  const groups = t.matches.filter((row) => row.kind === "group" && row.status !== "done");
  if (groups.length) return groups.filter((row) => !row.bye);
  for (const round of ["r16", "qf", "sf", "final"] as const) {
    const list = t.matches.filter((row) => row.round === round && row.status !== "done" && !row.bye);
    if (list.length) return list;
  }
  return [];
}

export function scoresTied(a: MatchScore | undefined, b: MatchScore | undefined): boolean {
  if (!a || !b) return false;
  return a.cards === b.cards && a.quiz === b.quiz && a.misses === b.misses;
}

export function startMatch(t: Tournament, matchId: string, parallel = false): Tournament {
  const match = t.matches.find((row) => row.id === matchId);
  if (!match) return t;
  if (match.status === "live" && (parallel || t.currentMatchId === matchId)) return t;
  const matches = t.matches.map((row) => {
    if (row.id === matchId) return { ...row, status: "live" as const, stechen: row.stechen };
    if (!parallel && row.status === "live") return { ...row, status: "pending" as const };
    return row;
  });
  const focus = matches.find((row) => row.status === "live");
  return bump({
    ...t,
    matches,
    currentMatchId: focus?.id ?? matchId,
    status: t.status === "done" ? t.status : t.status,
  });
}

export function skipByes(t: Tournament): Tournament {
  let next = t;
  for (let i = 0; i < 32; i += 1) {
    const match = nextPending(next);
    if (!match) break;
    if (match.status === "live") return next;
    if (!match.bye) return next;
    next = applyBye(next, match.id);
  }
  return next;
}

export function startBatch(t: Tournament, parallel: boolean): Tournament {
  let next = skipByes(t);
  const batch = pendingBatch(next);
  if (!batch.length) return next;
  if (!parallel) {
    const first = batch.find((row) => row.status === "pending") ?? batch[0];
    return first ? startMatch(next, first.id, false) : next;
  }
  for (const row of batch) {
    if (row.status === "done") continue;
    next = startMatch(next, row.id, true);
  }
  return next;
}

export function completeMatch(t: Tournament, matchId: string, ranking: MatchScore[]): Tournament {
  const match = t.matches.find((row) => row.id === matchId);
  if (!match || match.status === "done") return t;
  const ordered = sortScores(ranking);
  if (ordered.length >= 2 && scoresTied(ordered[0], ordered[1])) {
    const matches = t.matches.map((row) =>
      row.id === matchId ? { ...row, status: "live" as const, stechen: true } : row,
    );
    return bump({ ...t, matches, currentMatchId: matchId });
  }
  const winner = ordered[0];
  let next: Tournament = {
    ...t,
    matches: t.matches.map((row) =>
      row.id === matchId
        ? {
            ...row,
            status: "done",
            stechen: false,
            winnerIds: winner ? [winner.id] : row.winnerIds,
          }
        : row,
    ),
    currentMatchId: t.currentMatchId === matchId ? null : t.currentMatchId,
  };
  if (match.kind === "group" && match.groupId) {
    next = applyGroupTable(next, match.groupId, ordered);
    if (next.matches.filter((row) => row.kind === "group").every((row) => row.status === "done")) {
      next = openKnockout(next);
    }
  } else if (winner) {
    next = {
      ...next,
      matches: placeWinner(next.matches, matchId, winner.id),
    };
    if (match.round === "final") {
      next = { ...next, status: "done", championId: winner.id, currentMatchId: null };
    } else if (next.matches.filter((row) => row.kind === "knockout").every((row) => row.status === "done")) {
      const champ = next.matches.find((row) => row.round === "final")?.winnerIds[0] ?? winner.id;
      next = { ...next, status: "done", championId: champ, currentMatchId: null };
    } else {
      next = { ...next, status: "knockout" };
    }
  }
  return bump(next);
}

export function applyBye(t: Tournament, matchId: string): Tournament {
  const match = t.matches.find((row) => row.id === matchId);
  if (!match?.bye || !match.playerIds[0]) return t;
  const winnerId = match.playerIds[0];
  let matches = t.matches.map((row) =>
    row.id === matchId ? { ...row, status: "done" as const, winnerIds: [winnerId] } : row,
  );
  matches = placeWinner(matches, matchId, winnerId);
  const champ = matches.find((row) => row.round === "final" && row.status === "done")?.winnerIds[0];
  return bump({
    ...t,
    matches,
    currentMatchId: t.currentMatchId === matchId ? null : t.currentMatchId,
    status: champ ? "done" : t.status,
    championId: champ ?? t.championId,
  });
}

export function openKnockout(t: Tournament): Tournament {
  if (t.groups.length <= 1) {
    const table = t.groups[0]?.table ?? [];
    const champ = table[0]?.id ?? null;
    return bump({ ...t, status: "done", championId: champ, currentMatchId: null });
  }
  const qualifiers = collectQualifiers(t);
  if (qualifiers.length <= 1) {
    return bump({ ...t, status: "done", championId: qualifiers[0]?.id ?? null, currentMatchId: null });
  }
  const existingKo = t.matches.filter((row) => row.kind === "knockout");
  if (existingKo.length) {
    return bump({ ...t, status: "knockout" });
  }
  const idStart = t.matches.length;
  const { matches: ko } = buildKnockout(qualifiers, idStart);
  let matches = [...t.matches, ...ko];
  for (const row of ko) {
    if (row.bye && row.winnerIds[0]) {
      matches = placeWinner(matches, row.id, row.winnerIds[0]);
    }
  }
  return bump({ ...t, matches, status: "knockout" });
}

export function collectQualifiers(t: Tournament): CupPlayer[] {
  const names = new Map(t.players.map((row) => [row.id, row.name]));
  const perGroup = Math.max(1, t.qualify);
  const firsts: CupPlayer[] = [];
  const rest: CupPlayer[] = [];
  for (const group of t.groups) {
    const ranked = group.table.slice().sort(compareStanding);
    ranked.forEach((row, i) => {
      const player = { id: row.id, name: names.get(row.id) ?? row.name };
      if (i === 0) firsts.push(player);
      else if (i < perGroup) rest.push(player);
    });
  }
  rest.sort((a, b) => {
    const sa = standingOf(t, a.id);
    const sb = standingOf(t, b.id);
    return compareStanding(sb, sa);
  });
  return [...firsts, ...rest];
}

function standingOf(t: Tournament, id: string): CupStanding {
  for (const group of t.groups) {
    const row = group.table.find((item) => item.id === id);
    if (row) return row;
  }
  return emptyStanding({ id, name: id });
}

function applyGroupTable(t: Tournament, groupId: string, ranking: MatchScore[]): Tournament {
  const names = new Map(t.players.map((row) => [row.id, row.name]));
  const groups = t.groups.map((group) => {
    if (group.id !== groupId) return group;
    const table = ranking.map((row, i) => ({
      id: row.id,
      name: names.get(row.id) ?? row.name,
      played: 1,
      wins: i === 0 ? 1 : 0,
      cards: row.cards,
      quiz: row.quiz,
      misses: row.misses,
      rank: i + 1,
    }));
    return { ...group, table };
  });
  return { ...t, groups };
}

function sortScores(ranking: MatchScore[]): MatchScore[] {
  return ranking.slice().sort((a, b) => {
    if (b.cards !== a.cards) return b.cards - a.cards;
    if (b.quiz !== a.quiz) return b.quiz - a.quiz;
    return a.misses - b.misses;
  });
}

function compareStanding(a: CupStanding, b: CupStanding): number {
  if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
  if (b.cards !== a.cards) return b.cards - a.cards;
  if (b.quiz !== a.quiz) return b.quiz - a.quiz;
  return a.misses - b.misses;
}

function bump(t: Tournament): Tournament {
  return { ...t, rev: t.rev + 1 };
}

export function cupPreview(playerCount: number, groupPref: CupGroupSize, qualify: CupQualify): string {
  const n = Math.max(0, playerCount);
  if (n < CUP_MIN) return `Mindestens ${CUP_MIN} Personen für ein Turnier.`;
  const sizes = planGroupSizes(n, groupPref);
  const parts = countSizes(sizes);
  const groupBit = parts.join(", ");
  if (sizes.length <= 1) {
    return `${n} Personen, eine Gruppe. Die Reihenfolge in diesem Spiel ist die Turnierwertung.`;
  }
  const adv = sizes.length * qualify;
  const slots = nextPow(adv);
  const byes = slots - adv;
  const round = slots >= 16 ? "Achtelfinale" : slots >= 8 ? "Viertelfinale" : slots >= 4 ? "Halbfinale" : "Finale";
  const byeBit = byes > 0 ? `, ${byes} Freilos${byes === 1 ? "" : "e"}` : "";
  return `${n} Personen in ${sizes.length} Gruppen (${groupBit}). Je Gruppe Platz 1${qualify === 2 ? " und 2" : ""} weiter, danach ${round}${byeBit}.`;
}

function countSizes(sizes: number[]): string[] {
  const map = new Map<number, number>();
  for (const size of sizes) map.set(size, (map.get(size) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => `${count}×${size}`);
}

function nextPow(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(2, p);
}

export function playerOf(t: Tournament, id: string): CupPlayer | undefined {
  return t.players.find((row) => row.id === id);
}

export function matchTitle(match: CupMatch, t: Tournament): string {
  if (match.kind === "group") {
    const group = t.groups.find((row) => row.id === match.groupId);
    return group ? `Gruppe ${group.label}` : "Gruppe";
  }
  if (match.round === "r16") return "Achtelfinale";
  if (match.round === "qf") return "Viertelfinale";
  if (match.round === "sf") return "Halbfinale";
  return "Finale";
}

export function namesOf(ids: string[], t: Tournament): string {
  return ids.map((id) => playerOf(t, id)?.name ?? "Frei").join(" · ");
}

export { nextKnockoutRound };

export function parseCupConfig(raw: Partial<CupConfig> | null | undefined): CupConfig {
  const cupSize = raw?.cupSize === 3 || raw?.cupSize === 4 ? raw.cupSize : "auto";
  const cupQualify = raw?.cupQualify === 1 ? 1 : 2;
  const cupFlow = raw?.cupFlow === "par" ? "par" : "seq";
  return {
    cup: Boolean(raw?.cup),
    cupSize,
    cupQualify,
    cupFlow,
    cupAudio: raw?.cupAudio === "all" && cupFlow === "par" ? "all" : cupFlow === "par" ? "one" : "stage",
  };
}
