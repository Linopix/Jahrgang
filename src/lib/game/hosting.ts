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

/** Mesh-Host sendet Spielstand, Laden, Turnier. */
export function fromHost(from: string, hostId: string) {
  return Boolean(from && hostId && from === hostId);
}

/** Host oder Admin: Kick, Start, Config. */
export function fromControl(from: string, hostId: string, adminId?: string) {
  if (!from) return false;
  if (hostId && from === hostId) return true;
  if (adminId && from === adminId) return true;
  return false;
}

/** Host-Übernahme nur vom vorgesehenen Nachfolger, nicht von einem beliebigen Gast. */
export function acceptsHostTake(input: {
  from: string;
  claimedId: string;
  hostId: string;
  hostLive: boolean;
  members: { id: string; live?: boolean }[];
  tvId?: string;
}) {
  if (!input.from || input.from !== input.claimedId) return false;
  if (input.hostLive) return input.from === input.hostId;
  return shouldTakeHost({
    selfId: input.from,
    hostId: input.hostId,
    hostLive: false,
    members: input.members,
    tvId: input.tvId,
  });
}
