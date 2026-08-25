import { netSend } from "./net";
import { useGame, type SongGuess } from "./store";
import { roomConfigFrom, useOnline } from "./online-store";
import { clearRoomFromUrl } from "./room-code";
import type { RoomConfig } from "./types";
import type { OnlineMessage } from "./protocol";

function skipIds() {
  return useOnline
    .getState()
    .members.filter((m) => m.connectionState === "failed" || m.connectionState === "disconnected")
    .map((m) => m.id);
}

function pushState() {
  netSend({ t: "state", snapshot: useGame.getState().snapshot() } satisfies OnlineMessage);
}

export function isOnlinePlay() {
  return useOnline.getState().status === "playing";
}

export function canControlTurn() {
  const online = useOnline.getState();
  if (online.status !== "playing") return true;
  const current = useGame.getState().players[useGame.getState().currentPlayerIndex];
  return Boolean(current && current.id === online.selfId);
}

export function requestPlace(guess?: SongGuess) {
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    game.confirmPlacement(guess);
    return;
  }
  if (!canControlTurn() || game.selectedSlot === null) return;
  if (online.role === "host") {
    game.confirmPlacement(guess);
    pushState();
    return;
  }
  online.setPending(true);
  netSend({
    t: "action",
    kind: "place",
    slot: game.selectedSlot,
    title: guess?.title,
    artist: guess?.artist,
  } satisfies OnlineMessage);
}

export function requestDecade() {
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    game.useDecade();
    return;
  }
  if (!canControlTurn()) return;
  if (online.role === "host") {
    game.useDecade();
    pushState();
    return;
  }
  netSend({ t: "action", kind: "decade" } satisfies OnlineMessage);
}

export function requestSkip() {
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    game.useSkip();
    return;
  }
  if (!canControlTurn()) return;
  if (online.role === "host") {
    game.useSkip();
    pushState();
    return;
  }
  netSend({ t: "action", kind: "skip" } satisfies OnlineMessage);
}

export function requestNext() {
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    game.nextTurn();
    return;
  }
  const current = game.players[game.currentPlayerIndex];
  const allowed = current?.id === online.selfId || online.role === "host";
  if (!allowed) return;
  if (online.role === "host") {
    game.nextTurn({ skipIds: skipIds() });
    pushState();
    return;
  }
  online.setPending(true);
  netSend({ t: "action", kind: "next" } satisfies OnlineMessage);
}

export function requestConfig(patch: Partial<RoomConfig>) {
  const online = useOnline.getState();
  const next: RoomConfig = { ...roomConfigFrom(online), ...patch };
  online.setConfig(next);
  if (online.role === "host") {
    netSend({ t: "config", ...next } satisfies OnlineMessage);
  }
}

export async function requestStartOnline() {
  const online = useOnline.getState();
  if (online.role !== "host") return;
  const seats = online.members.filter((m) => m.connectionState !== "failed").slice(0, 8);
  if (seats.length < 2) return;
  online.setPending(true);
  online.setError(null);
  netSend({ t: "loading" } satisfies OnlineMessage);
  const ok = await useGame.getState().startGame({
    mode: "party",
    names: seats.map((m) => m.name),
    ids: seats.map((m) => m.id),
    era: online.era,
    target: online.target,
    variant: online.variant,
    tokens: online.tokens,
    playlistUrl: online.playlistUrl || undefined,
  });
  if (!ok) {
    const error = useGame.getState().loadError ?? "Start fehlgeschlagen.";
    useGame.getState().resetBoard();
    online.markLobby();
    online.setError(error);
    netSend({ t: "start-failed", error } satisfies OnlineMessage);
    return;
  }
  online.markPlaying();
  pushState();
}

export function requestBackToLobby() {
  const online = useOnline.getState();
  useGame.getState().resetBoard();
  if (online.status === "off") return;
  online.markLobby();
  if (online.role === "host") {
    netSend({ t: "back-lobby" } satisfies OnlineMessage);
  }
}

export function requestLeave() {
  const online = useOnline.getState();
  if (online.role === "host") {
    netSend({ t: "host-left" } satisfies OnlineMessage);
  }
  useGame.getState().openHome();
  online.leaveRoom();
  clearRoomFromUrl();
}
