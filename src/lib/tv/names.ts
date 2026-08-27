export const TV_STAGE_NAME = "Fernseher";
export const TV_MODE_NAME = "Wohnzimmer";

export type TvStep = "claim" | "setup" | "invite";

export function takeClaim(input: {
  claimOpen: boolean;
  wantsClaim: boolean;
  tvId: string;
  adminId: string;
  from: string;
}): { adminId: string; claimOpen: false; tvStep: "setup" } | null {
  if (!input.claimOpen || !input.wantsClaim) return null;
  if (!input.from || input.from === input.tvId) return null;
  if (input.adminId && input.adminId !== input.tvId) return null;
  return { adminId: input.from, claimOpen: false, tvStep: "setup" };
}

export function skipClaim(tvId: string) {
  return { adminId: tvId, claimOpen: false as const, tvStep: "setup" as const };
}
