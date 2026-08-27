import type { CupMatch, CupPlayer, CupRound } from "./types.ts";

export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(2, p);
}

export function knockoutRound(slots: number): CupRound {
  if (slots >= 16) return "r16";
  if (slots >= 8) return "qf";
  if (slots >= 4) return "sf";
  return "final";
}

export function nextKnockoutRound(round: CupRound): CupRound | null {
  if (round === "r16") return "qf";
  if (round === "qf") return "sf";
  if (round === "sf") return "final";
  return null;
}

/**
 * Qualifikanten in ein K.o.-Feld. Freilose füllen auf die nächste Zweierpotenz.
 * Paarung der ersten Runde: 1 gegen Letzter, 2 gegen Vorletzten.
 */
export function buildKnockout(
  qualifiers: CupPlayer[],
  idStart = 0,
): { matches: CupMatch[]; firstRound: CupRound } {
  const n = qualifiers.length;
  if (n <= 1) return { matches: [], firstRound: "final" };
  const slots = nextPowerOfTwo(n);
  const firstRound = knockoutRound(slots);
  const padded: (CupPlayer | null)[] = qualifiers.slice();
  while (padded.length < slots) padded.push(null);
  const ordered = seedPairs(padded);

  const rounds: CupRound[] = [firstRound];
  let size = slots;
  let round: CupRound | null = firstRound;
  while (round && size > 2) {
    const next = nextKnockoutRound(round);
    if (!next) break;
    rounds.push(next);
    size /= 2;
    round = next;
  }

  let id = idStart;
  const byRound: CupMatch[][] = [];
  const first: CupMatch[] = [];
  for (let i = 0; i < ordered.length; i += 2) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const ids = [a?.id, b?.id].filter((value): value is string => Boolean(value));
    const bye = ids.length < 2;
    first.push({
      id: `k${id++}`,
      kind: "knockout",
      round: firstRound,
      playerIds: ids,
      winnerIds: bye && ids[0] ? [ids[0]] : [],
      status: bye ? "done" : "pending",
      bye,
      stechen: false,
      seed: i / 2,
    });
  }
  byRound.push(first);

  for (let r = 1; r < rounds.length; r++) {
    const prev = byRound[r - 1] ?? [];
    const curr: CupMatch[] = [];
    const name = rounds[r] ?? "final";
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = prev[i + 1];
      const slotsIds = [
        left?.bye ? left.winnerIds[0] ?? "" : "",
        right?.bye ? right.winnerIds[0] ?? "" : "",
      ];
      const filled = slotsIds.filter(Boolean);
      curr.push({
        id: `k${id++}`,
        kind: "knockout",
        round: name,
        playerIds: filled,
        winnerIds: [],
        status: "pending",
        bye: false,
        stechen: false,
      });
    }
    byRound.push(curr);
  }

  for (let r = 0; r < byRound.length - 1; r++) {
    const prev = byRound[r] ?? [];
    const curr = byRound[r + 1] ?? [];
    for (let i = 0; i < prev.length; i++) {
      const parent = curr[Math.floor(i / 2)];
      const match = prev[i];
      if (!parent || !match) continue;
      match.nextMatchId = parent.id;
      match.nextSlot = (i % 2) as 0 | 1;
    }
  }

  return { matches: byRound.flat(), firstRound };
}

function seedPairs<T>(seeds: T[]): T[] {
  const out: T[] = [];
  const n = seeds.length;
  for (let i = 0; i < n / 2; i++) {
    const a = seeds[i];
    const b = seeds[n - 1 - i];
    if (a !== undefined) out.push(a);
    if (b !== undefined) out.push(b);
  }
  return out;
}

export function placeWinner(matches: CupMatch[], fromId: string, winnerId: string): CupMatch[] {
  const from = matches.find((row) => row.id === fromId);
  if (!from?.nextMatchId) return matches;
  return matches.map((row) => {
    if (row.id !== from.nextMatchId) return row;
    if (row.playerIds.includes(winnerId)) return row;
    const ids = row.playerIds.slice();
    if (from.nextSlot === 0) ids.unshift(winnerId);
    else ids.push(winnerId);
    const filled = ids.filter(Boolean).slice(0, 2);
    return {
      ...row,
      playerIds: filled,
      bye: filled.length < 2,
      status: filled.length >= 2 && row.status !== "done" ? "pending" : row.status,
    };
  });
}
