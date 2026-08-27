import { TV_LIVE } from "./flags";
import { CUP_MAX, TABLE_CAP, TOURNAMENT_LIVE, liveMatches, matchOfPlayer } from "@/lib/tournament";
import { useOnline, type OnlineMember } from "@/lib/game/online-store";

export { TV_MODE_NAME, TV_STAGE_NAME, pickSuccessor, skipClaim, takeClaim, type TvStep } from "./names";

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

export function canSteerRoom() {
  const online = useOnline.getState();
  if (TOURNAMENT_LIVE && online.cup) return online.role === "host";
  if (!online.selfId) return online.role === "host";
  if (online.adminId) return online.adminId === online.selfId;
  return online.role === "host";
}

export function canPlayCue() {
  const online = useOnline.getState();
  if (TOURNAMENT_LIVE && online.cup && online.status === "playing") {
    if (online.cupFlow === "par") {
      if (isTvScreen()) return false;
      const match = matchOfPlayer(online.tournament, online.selfId);
      if (!match) return false;
      if (online.cupAudio === "all") return true;
      const speaker = online.cupSpeakers[match.id] ?? match.playerIds[0];
      return online.selfId === speaker;
    }
    return isTvScreen();
  }
  if (!isTvRemote()) return true;
  return online.stageAudio === "all";
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

export function roomCap(cup?: boolean) {
  return TOURNAMENT_LIVE && cup ? CUP_MAX : TABLE_CAP + 1;
}

export function playerSeats(
  members: OnlineMember[],
  hostId: string,
  tv: boolean,
  stagePlays = false,
  cup = false,
) {
  const live = members.filter(
    (m) => m.connectionState !== "failed" && m.connectionState !== "disconnected",
  );
  const pool = isTvRoom(tv) && !stagePlays ? live.filter((m) => m.id !== hostId) : live;
  const cap = TOURNAMENT_LIVE && cup ? CUP_MAX : TABLE_CAP;
  return pool.slice(0, cap);
}

export function isAdmin() {
  const online = useOnline.getState();
  if (TOURNAMENT_LIVE && online.cup) return online.role === "host";
  if (!online.selfId) return online.role === "host";
  if (online.adminId) return online.adminId === online.selfId;
  return online.role === "host";
}

export function useIsAdmin() {
  const selfId = useOnline((s) => s.selfId);
  const adminId = useOnline((s) => s.adminId);
  const role = useOnline((s) => s.role);
  const cup = useOnline((s) => s.cup);
  if (TOURNAMENT_LIVE && cup) return role === "host";
  if (selfId && adminId) return adminId === selfId;
  return role === "host";
}

export function useParallelCup() {
  const cup = useOnline((s) => s.cup);
  const flow = useOnline((s) => s.cupFlow);
  const live = liveMatches(useOnline((s) => s.tournament));
  return Boolean(TOURNAMENT_LIVE && cup && flow === "par" && live.length > 1);
}