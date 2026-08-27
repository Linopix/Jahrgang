import type { Tournament, CupGroup, CupMatch, CupPlayer, CupStanding } from "./types.ts";
import { isCupGroupSize, isCupQualify } from "./types.ts";

export function parseTournament(raw: unknown): Tournament | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<Tournament>;
  if (!Array.isArray(row.players) || !Array.isArray(row.matches) || !Array.isArray(row.groups)) {
    return null;
  }
  const status =
    row.status === "groups" || row.status === "knockout" || row.status === "done" || row.status === "idle"
      ? row.status
      : "idle";
  return {
    rev: typeof row.rev === "number" && Number.isFinite(row.rev) ? row.rev : 0,
    status,
    groupPref: isCupGroupSize(row.groupPref) ? row.groupPref : "auto",
    qualify: isCupQualify(row.qualify) ? row.qualify : 2,
    players: row.players.map(parsePlayer).filter((item): item is CupPlayer => Boolean(item)),
    groups: row.groups.map(parseGroup).filter((item): item is CupGroup => Boolean(item)),
    matches: row.matches.map(parseMatch).filter((item): item is CupMatch => Boolean(item)),
    currentMatchId: typeof row.currentMatchId === "string" ? row.currentMatchId : null,
    championId: typeof row.championId === "string" ? row.championId : null,
  };
}

function parsePlayer(raw: unknown): CupPlayer | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CupPlayer>;
  if (typeof row.id !== "string" || !row.id) return null;
  return { id: row.id, name: typeof row.name === "string" ? row.name : row.id };
}

function parseStanding(raw: unknown): CupStanding | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CupStanding>;
  if (typeof row.id !== "string" || !row.id) return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : row.id,
    played: num(row.played),
    wins: num(row.wins),
    cards: num(row.cards),
    quiz: num(row.quiz),
    misses: num(row.misses),
    rank: num(row.rank),
  };
}

function parseGroup(raw: unknown): CupGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CupGroup>;
  if (typeof row.id !== "string" || !row.id) return null;
  return {
    id: row.id,
    label: typeof row.label === "string" ? row.label : row.id,
    playerIds: Array.isArray(row.playerIds) ? row.playerIds.filter((id): id is string => typeof id === "string") : [],
    table: Array.isArray(row.table)
      ? row.table.map(parseStanding).filter((item): item is CupStanding => Boolean(item))
      : [],
    matchId: typeof row.matchId === "string" ? row.matchId : "",
  };
}

function parseMatch(raw: unknown): CupMatch | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CupMatch>;
  if (typeof row.id !== "string" || !row.id) return null;
  const round =
    row.round === "group" || row.round === "r16" || row.round === "qf" || row.round === "sf" || row.round === "final"
      ? row.round
      : "group";
  const status = row.status === "live" || row.status === "done" || row.status === "pending" ? row.status : "pending";
  return {
    id: row.id,
    kind: row.kind === "knockout" ? "knockout" : "group",
    round,
    groupId: typeof row.groupId === "string" ? row.groupId : undefined,
    playerIds: Array.isArray(row.playerIds) ? row.playerIds.filter((id): id is string => typeof id === "string") : [],
    winnerIds: Array.isArray(row.winnerIds) ? row.winnerIds.filter((id): id is string => typeof id === "string") : [],
    status,
    bye: Boolean(row.bye),
    stechen: Boolean(row.stechen),
    seed: typeof row.seed === "number" ? row.seed : undefined,
    nextMatchId: typeof row.nextMatchId === "string" ? row.nextMatchId : undefined,
    nextSlot: row.nextSlot === 1 ? 1 : row.nextSlot === 0 ? 0 : undefined,
  };
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
