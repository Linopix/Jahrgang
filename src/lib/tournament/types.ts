export type CupGroupSize = "auto" | 3 | 4;
export type CupQualify = 1 | 2;
export type CupStatus = "idle" | "groups" | "knockout" | "done";
export type CupMatchKind = "group" | "knockout";
export type CupRound = "group" | "r16" | "qf" | "sf" | "final";
export type CupMatchStatus = "pending" | "live" | "done";

export type CupPlayer = {
  id: string;
  name: string;
};

export type CupStanding = {
  id: string;
  name: string;
  played: number;
  wins: number;
  cards: number;
  quiz: number;
  misses: number;
  rank: number;
};

export type CupGroup = {
  id: string;
  label: string;
  playerIds: string[];
  table: CupStanding[];
  matchId: string;
};

export type CupMatch = {
  id: string;
  kind: CupMatchKind;
  round: CupRound;
  groupId?: string;
  playerIds: string[];
  winnerIds: string[];
  status: CupMatchStatus;
  bye: boolean;
  stechen: boolean;
  seed?: number;
  nextMatchId?: string;
  nextSlot?: 0 | 1;
};

export type Tournament = {
  rev: number;
  status: CupStatus;
  groupPref: CupGroupSize;
  qualify: CupQualify;
  players: CupPlayer[];
  groups: CupGroup[];
  matches: CupMatch[];
  currentMatchId: string | null;
  championId: string | null;
};

export type CupFlow = "seq" | "par";
export type CupAudio = "stage" | "one" | "all";

export const DEFAULT_CUP_FLOW: CupFlow = "seq";
export const DEFAULT_CUP_AUDIO: CupAudio = "stage";

export function isCupFlow(value: unknown): value is CupFlow {
  return value === "seq" || value === "par";
}

export function isCupAudio(value: unknown): value is CupAudio {
  return value === "stage" || value === "one" || value === "all";
}

export function parseCupFlow(value: unknown): CupFlow {
  return isCupFlow(value) ? value : DEFAULT_CUP_FLOW;
}

export function parseCupAudio(value: unknown, flow: CupFlow = DEFAULT_CUP_FLOW): CupAudio {
  if (flow === "seq") return "stage";
  if (value === "one" || value === "all") return value;
  return "one";
}

export type CupConfig = {
  cup: boolean;
  cupSize: CupGroupSize;
  cupQualify: CupQualify;
  cupFlow: CupFlow;
  cupAudio: CupAudio;
};

export const DEFAULT_CUP_SIZE: CupGroupSize = "auto";
export const DEFAULT_CUP_QUALIFY: CupQualify = 2;

export const ROUND_LABELS: Record<CupRound, string> = {
  group: "Gruppenphase",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  final: "Finale",
};

export function isCupGroupSize(value: unknown): value is CupGroupSize {
  return value === "auto" || value === 3 || value === 4;
}

export function isCupQualify(value: unknown): value is CupQualify {
  return value === 1 || value === 2;
}

export function parseCupSize(value: unknown): CupGroupSize {
  return isCupGroupSize(value) ? value : DEFAULT_CUP_SIZE;
}

export function parseCupQualify(value: unknown): CupQualify {
  return isCupQualify(value) ? value : DEFAULT_CUP_QUALIFY;
}

export function emptyStanding(player: CupPlayer): CupStanding {
  return {
    id: player.id,
    name: player.name,
    played: 0,
    wins: 0,
    cards: 0,
    quiz: 0,
    misses: 0,
    rank: 0,
  };
}
