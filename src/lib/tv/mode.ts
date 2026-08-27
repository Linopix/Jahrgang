import { TV_LIVE } from "./flags";
import { useOnline, type OnlineMember } from "@/lib/game/online-store";

export { TV_MODE_NAME, TV_STAGE_NAME, skipClaim, takeClaim, type TvStep } from "./names";

export function isTvRoom(tv?: boolean) {
  return TV_LIVE && Boolean(tv);
}

export function isTvScreen() {
  if (!TV_LIVE) return false;
  const online = useOnline.getState();
  return online.tv && online.role === "host";
}

export function isTvRemote() {
  if (!TV_LIVE) return false;
  const online = useOnline.getState();
  return online.tv && online.role === "guest";
}

export function useTvScreen() {
  const tv = useOnline((s) => s.tv);
  const role = useOnline((s) => s.role);
  return TV_LIVE && tv && role === "host";
}

export function useTvRemote() {
  const tv = useOnline((s) => s.tv);
  const role = useOnline((s) => s.role);
  return TV_LIVE && tv && role === "guest";
}

export function playerSeats(members: OnlineMember[], hostId: string, tv: boolean) {
  const live = members.filter(
    (m) => m.connectionState !== "failed" && m.connectionState !== "disconnected",
  );
  if (isTvRoom(tv)) {
    return live.filter((m) => m.id !== hostId).slice(0, 8);
  }
  return live.slice(0, 8);
}

export function isAdmin() {
  const online = useOnline.getState();
  if (!online.selfId) return online.role === "host";
  if (online.adminId) return online.adminId === online.selfId;
  return online.role === "host";
}

export function useIsAdmin() {
  const selfId = useOnline((s) => s.selfId);
  const adminId = useOnline((s) => s.adminId);
  const role = useOnline((s) => s.role);
  if (selfId && adminId) return adminId === selfId;
  return role === "host";
}
