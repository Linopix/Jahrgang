import { netDrop, netSend } from "./net";
import { useGame, type SongGuess } from "./store";
import { roomConfigFrom, useOnline } from "./online-store";
import { clearRoomFromUrl } from "./room-code";
import type { RoomConfig } from "./types";
import type { OnlineMessage } from "./protocol";
import { isAdmin, isTvRoom, isTvScreen, playerSeats } from "@/lib/tv/mode";
import { pickSuccessor, type TvStep } from "@/lib/tv/names";
import { nextHostId } from "./hosting";
import { rankPlayers } from "./engine";
import { useSessionExit } from "./session-exit";
import { noteDebug } from "./debug";

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
  if (isTvScreen() && !online.stagePlays) return false;
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

export function requestSelectSlot(index: number) {
  const game = useGame.getState();
  const online = useOnline.getState();
  if (online.status === "playing" && !canControlTurn()) return;
  game.selectSlot(index);
  if (online.status !== "playing") return;
  netSend({ t: "aim", slot: useGame.getState().selectedSlot } satisfies OnlineMessage);
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
    const seats = playerSeats(online.members, online.hostId, online.tv, online.stagePlays);
    const need = isTvRoom(online.tv) ? 1 : 2;
    if (seats.length < need) return;
    online.setPending(true);
    online.setError(null);
    netSend({ t: "admin-start" } satisfies OnlineMessage);
    return;
  }
  const seats = playerSeats(online.members, online.hostId, online.tv, online.stagePlays);
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
    eras: online.eras,
    pool: online.pool,
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
  const game = useGame.getState();
  const playing =
    game.phase === "listen" || game.phase === "reveal" || game.phase === "winner" || game.phase === "loading";
  if (playing) {
    const player =
      game.players.find((row) => row.id === online.selfId) ??
      game.players.find((row) => row.name === online.selfName) ??
      null;
    const ranked = rankPlayers(game.players);
    const place = player ? ranked.findIndex((row) => row.id === player.id) + 1 : 0;
    useSessionExit.getState().showLeft({
      name: player?.name || online.selfName || "Du",
      player,
      place,
      stats: game.stats,
      roundStats: game.roundStats,
      series: game.series,
    });
  }
  if (online.role === "host") {
    const successor = nextHostId(
      online.members.map((row) => ({
        id: row.id,
        live: row.connectionState !== "failed" && row.connectionState !== "disconnected",
      })),
      online.selfId,
      online.tv ? online.selfId : "",
    );
    const adminLive = online.members.some(
      (row) =>
        row.id === online.adminId &&
        row.id !== online.selfId &&
        row.connectionState !== "failed" &&
        row.connectionState !== "disconnected",
    );
    if (successor && successor !== online.selfId) {
      noteDebug("out", "host-take", successor);
      netSend({
        t: "host-take",
        hostId: successor,
        adminId: adminLive ? online.adminId : successor,
      } satisfies OnlineMessage);
    } else {
      netSend({ t: "host-left" } satisfies OnlineMessage);
    }
  } else if (isAdmin()) {
    const successor = pickSuccessor(
      online.members.map((row) => ({
        id: row.id,
        live: row.connectionState !== "failed" && row.connectionState !== "disconnected",
      })),
      online.selfId,
      online.tv ? online.hostId : "",
    );
    if (successor && successor !== online.selfId) {
      netSend({ t: "pass-admin", id: successor } satisfies OnlineMessage);
    }
  }
  game.openHome();
  online.leaveRoom();
  clearRoomFromUrl();
}

export function requestEndEvening() {
  const series = useGame.getState().series;
  if (!series.length) return;
  useSessionExit.getState().showEvening(series);
  if (useOnline.getState().status !== "off") {
    noteDebug("out", "evening");
    netSend({ t: "evening" } satisfies OnlineMessage);
  }
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

export function requestPassAdmin(peerId: string) {
  const online = useOnline.getState();
  if (!isAdmin()) return;
  if (!peerId || peerId === online.adminId) return;
  const row = online.members.find((m) => m.id === peerId);
  if (!row || row.connectionState === "failed" || row.connectionState === "disconnected") return;
  if (online.role === "host") {
    online.setAdminId(peerId);
  }
  netSend({ t: "pass-admin", id: peerId } satisfies OnlineMessage);
}

export function requestStagePlays(on: boolean) {
  const online = useOnline.getState();
  if (!online.tv) return;
  if (!isAdmin() && !isTvScreen()) return;
  if (online.role === "host") {
    online.setStagePlays(on);
    return;
  }
  online.setStagePlays(on);
  netSend({ t: "config", ...roomConfigFrom(online), stagePlays: on } satisfies OnlineMessage);
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

