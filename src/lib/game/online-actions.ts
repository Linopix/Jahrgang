import { netDrop, netSend } from "./net";
import { useGame, type SongGuess } from "./store";
import { roomConfigFrom, useOnline } from "./online-store";
import { clearRoomFromUrl } from "./room-code";
import type { RoomConfig } from "./types";
import type { OnlineMessage } from "./protocol";
import { isAdmin, isTvRoom, isTvScreen, playerSeats } from "@/lib/tv/mode";
import type { TvStep } from "@/lib/tv/names";

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
  if (isTvScreen()) return false;
  const current = useGame.getState().players[useGame.getState().currentPlayerIndex];
  return Boolean(current && current.id === online.selfId);
}

export function canSeeCue() {
  const online = useOnline.getState();
  if (online.status !== "playing") return true;
  return isAdmin();
}

export function canStartNextRound() {
  const online = useOnline.getState();
  if (online.status !== "playing") return true;
  if (isAdmin()) return true;
  return online.nextRound === "all";
}

export function canEndGame() {
  const online = useOnline.getState();
  if (online.status !== "playing") return true;
  return isAdmin();
}

export function requestEnd() {
  if (!canEndGame()) return;
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    game.endGame();
    return;
  }
  if (online.role === "host") {
    game.endGame();
    pushState();
    return;
  }
  netSend({ t: "action", kind: "end" } satisfies OnlineMessage);
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
  if (!isAdmin() && online.role !== "host") return;
  const next: RoomConfig = { ...roomConfigFrom(online), ...patch };
  online.setConfig(next);
  netSend({ t: "config", ...next } satisfies OnlineMessage);
}

export async function requestStartOnline() {
  const online = useOnline.getState();
  if (!isAdmin() && online.role !== "host") return;
  if (online.role !== "host") {
    if (!isAdmin()) return;
    const seats = playerSeats(online.members, online.hostId, online.tv);
    const need = isTvRoom(online.tv) ? 1 : 2;
    if (seats.length < need) return;
    online.setPending(true);
    online.setError(null);
    netSend({ t: "admin-start" } satisfies OnlineMessage);
    return;
  }
  const seats = playerSeats(online.members, online.hostId, online.tv);
  const need = isTvRoom(online.tv) ? 1 : 2;
  if (seats.length < need) return;
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
    mixFrom: online.mixFrom,
    mixTo: online.mixTo,
    mixGenre: online.mixGenre,
    custom: online.custom,
    extraEra: online.extraEra,
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

export async function requestAgain() {
  const online = useOnline.getState();
  const game = useGame.getState();
  if (online.status !== "playing") {
    if (game.lastSetup) {
      await game.startGame(game.lastSetup);
      return;
    }
    game.openSetup(game.mode);
    return;
  }
  if (!canStartNextRound()) return;
  if (online.role === "host") {
    await requestStartOnline();
    return;
  }
  online.setPending(true);
  netSend({ t: "again" } satisfies OnlineMessage);
}

export function requestBackToLobby() {
  const online = useOnline.getState();
  if (online.status === "playing" && !canStartNextRound()) return;
  useGame.getState().resetBoard();
  if (online.status === "off") return;
  online.markLobby();
  if (online.tv) online.setTvStep("invite");
  netSend({ t: "back-lobby" } satisfies OnlineMessage);
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

export function requestKick(peerId: string) {
  const online = useOnline.getState();
  if (!isAdmin()) return;
  if (online.status === "playing") return;
  if (!peerId || peerId === online.selfId || peerId === online.hostId) return;
  if (online.role === "host") {
    netSend({ t: "kick" } satisfies OnlineMessage, peerId);
    useOnline.setState({
      kickedIds: [...new Set([...online.kickedIds, peerId])],
      members: online.members.filter((row) => row.id !== peerId),
    });
    window.setTimeout(() => netDrop(peerId), 80);
    return;
  }
  netSend({ t: "admin-kick", id: peerId } satisfies OnlineMessage);
}

export function requestTvStep(step: TvStep) {
  const online = useOnline.getState();
  if (!isAdmin()) return;
  if (!online.tv) return;
  online.setTvStep(step);
  netSend({ t: "tv-step", step } satisfies OnlineMessage);
}

export function requestSkipTvClaim() {
  const online = useOnline.getState();
  if (online.role !== "host" || !online.tv) return;
  online.skipTvClaim();
}

