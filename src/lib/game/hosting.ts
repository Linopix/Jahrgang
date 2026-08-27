import { pickSuccessor } from "../tv/names.ts";

export const HOST_GRACE_MS = 12_000;

export function liveRows(members: { id: string; live?: boolean }[]) {
  return members.filter((row) => row.live !== false);
}

export function nextHostId(
  members: { id: string; live?: boolean }[],
  leavingId: string,
  tvId = "",
) {
  return pickSuccessor(members, leavingId, tvId) || "";
}

export function shouldTakeHost(input: {
  selfId: string;
  hostId: string;
  hostLive: boolean;
  members: { id: string; live?: boolean }[];
  tvId?: string;
}) {
  if (input.hostLive) return false;
  if (!input.selfId || input.selfId === input.hostId) return false;
  return nextHostId(input.members, input.hostId, input.tvId ?? "") === input.selfId;
}
