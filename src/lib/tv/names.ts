export const TV_STAGE_NAME = "Bühne";
export const TV_MODE_NAME = "Bigscreen";

export type TvStep = "claim" | "setup" | "invite";

export function takeClaim(input: {
  claimOpen: boolean;
  tvId: string;
  adminId: string;
  from: string;
}): { adminId: string; claimOpen: false; tvStep: "setup"; stagePlays: false } | null {
  if (!input.claimOpen) return null;
  if (!input.from || input.from === input.tvId) return null;
  if (input.adminId && input.adminId !== input.tvId) return null;
  return { adminId: input.from, claimOpen: false, tvStep: "setup", stagePlays: false };
}

export function skipClaim(tvId: string) {
  return {
    adminId: tvId,
    claimOpen: false as const,
    tvStep: "setup" as const,
    stagePlays: true,
  };
}

export function pickSuccessor(
  members: { id: string; live?: boolean }[],
  leavingId: string,
  tvId: string,
) {
  const live = members.filter((row) => row.id !== leavingId && row.live !== false);
  return live.find((row) => row.id !== tvId)?.id ?? live[0]?.id ?? tvId;
}
