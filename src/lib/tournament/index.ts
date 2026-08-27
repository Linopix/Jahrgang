export { TOURNAMENT_LIVE, TOURNAMENT_MODE_ENABLED, CUP_MIN, CUP_MAX, TABLE_CAP } from "./flags";
export {
  DEFAULT_CUP_QUALIFY,
  DEFAULT_CUP_SIZE,
  ROUND_LABELS,
  emptyStanding,
  isCupGroupSize,
  isCupQualify,
  parseCupQualify,
  parseCupSize,
  type CupConfig,
  type CupGroup,
  type CupGroupSize,
  type CupMatch,
  type CupMatchKind,
  type CupMatchStatus,
  type CupPlayer,
  type CupQualify,
  type CupRound,
  type CupStanding,
  type CupStatus,
  type Tournament,
} from "./types";
export { planGroupSizes, groupLabel, splitBySizes } from "./groups";
export { buildKnockout, nextPowerOfTwo, knockoutRound, placeWinner } from "./bracket";
export {
  applyBye,
  collectQualifiers,
  completeMatch,
  createTournament,
  cupPreview,
  currentMatch,
  matchTitle,
  namesOf,
  nextPending,
  openKnockout,
  parseCupConfig,
  playerOf,
  scoresTied,
  startMatch,
  type MatchScore,
} from "./engine";
export { parseTournament } from "./wire";
