import { netDrop, netSend } from "./net";
import { useGame, type SongGuess } from "./store";
import { roomConfigFrom, useOnline } from "./online-store";
import { clearRoomFromUrl } from "./room-code";
import type { GameSnapshot, RoomConfig } from "./types";
import type { OnlineMessage } from "./protocol";
import { isAdmin, isTvRoom, isTvScreen, playerSeats } from "@/lib/tv/mode";
import { pickSuccessor, type TvStep } from "@/lib/tv/names";
import { nextHostId } from "./hosting";
import { makePin, pinReady, ROOM_PIN_LIVE } from "./pin";
import { rankPlayers, songsFromBoard } from "./engine";
import { useSessionExit } from "./session-exit";
import { noteDebug } from "./debug";
import {
  TOURNAMENT_LIVE,
  CUP_MIN,
  applyBye,
  boardFromSnapshot,
  completeMatch,
  createTournament,
  currentMatch,
  liveMatches,
  matchOfPlayer,
  matchTitle,
  skipByes,
  startBatch,
  type CupBoardCard,
  type MatchScore,
} from "@/lib/tournament";

function skipIds() {
  return useOnline
    .getState()
    .members.filter((m) => m.connectionState === "failed" || m.connectionState === "disconnected")
    .map((m) => m.id);
}

function pushState() {
  netSend({ t: "state", snapshot: useGame.getState().snapshot() } satisfies OnlineMessage);
}

function pushCup() {
  if (!TOURNAMENT_LIVE) return;
  netSend({ t: "cup", tournament: useOnline.getState().tournament } satisfies OnlineMessage);
}

export function cupSeats() {
  const online = useOnline.getState();
  return playerSeats(online.members, online.hostId, online.tv, online.stagePlays, online.cup);
}

function rankingFromGame(): MatchScore[] {
  return rankPlayers(useGame.getState().players).map((row) => ({
    id: row.id,
    name: row.name,
    cards: row.timeline.length,
    quiz: row.quiz ?? 0,
    misses: row.misses,
  }));
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
  if (TOURNAMENT_LIVE && online.cup && online.role !== "host") return;
  const next: RoomConfig = { ...roomConfigFrom(online), ...patch };
  if (online.cup) {
    next.cup = true;
    next.tv = true;
  } else {
    next.cup = false;
  }
  online.setConfig(next);
  netSend({ t: "config", ...next } satisfies OnlineMessage);
}

export function requestSetRoomPin(on: boolean) {
  if (!ROOM_PIN_LIVE) return;
  const online = useOnline.getState();
  if (online.role !== "host") return;
  online.setRoomPin(on ? makePin() : "");
}

export function requestSubmitPin() {
  if (!ROOM_PIN_LIVE) return;
  const online = useOnline.getState();
  if (!pinReady(online.joinPin)) return;
  netSend({
    t: "hello",
    name: online.selfName,
    pin: online.joinPin,
    resume: true,
    claim: online.claimIntent,
  } satisfies OnlineMessage);
}

export async function requestStartOnline() {
  const online = useOnline.getState();
  if (!isAdmin() && online.role !== "host") return;
  if (TOURNAMENT_LIVE && online.cup) {
    await requestStartCup();
    return;
  }
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
    suggest: online.suggest,
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

async function requestStartCup() {
  const online = useOnline.getState();
  if (online.role !== "host") {
    if (!isAdmin()) return;
    online.setPending(true);
    online.setError(null);
    netSend({ t: "admin-start" } satisfies OnlineMessage);
    return;
  }
  const seats = cupSeats();
  if (seats.length < CUP_MIN) {
    online.setError(`Turnier: mindestens ${CUP_MIN} Personen.`);
    return;
  }
  online.setPending(true);
  online.setError(null);
  let t = online.tournament;
  if (!t || t.status === "idle" || t.status === "done") {
    t = createTournament(
      seats.map((row) => ({ id: row.id, name: row.name })),
      { groupPref: online.cupSize, qualify: online.cupQualify },
    );
    online.setTournament(t);
    pushCup();
  }
  if (t.status === "done") {
    online.setPending(false);
    return;
  }
  const parallel = online.cupFlow === "par";
  t = startBatch(t, parallel);
  online.setTournament(t);
  pushCup();
  if (t.status === "done") {
    online.setPending(false);
    return;
  }
  const batch = liveMatches(t).filter((row) => !row.bye);
  if (!batch.length) {
    online.setPending(false);
    pushCup();
    return;
  }
  const tables: Record<string, GameSnapshot> = {};
  const speakers: Record<string, string> = {};
  netSend({ t: "loading" } satisfies OnlineMessage);
  let pile = online.cupPile.slice();
  for (const match of batch) {
    const ids = new Set(match.playerIds);
    const matchSeats = seats.filter((row) => ids.has(row.id));
    if (matchSeats.length < 2) {
      t = applyBye(t, match.id);
      online.setTournament(t);
      continue;
    }
    const ok = await useGame.getState().startGame({
      mode: "party",
      names: matchSeats.map((m) => m.name),
      ids: matchSeats.map((m) => m.id),
      era: online.era,
      target: match.stechen ? 2 : online.target,
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
      suggest: online.suggest,
      fullPile: true,
      readyPile: pile.length ? pile : undefined,
    });
    if (!ok) {
      const error = useGame.getState().loadError ?? "Start fehlgeschlagen.";
      useGame.getState().resetBoard();
      online.markLobby();
      online.setError(error);
      netSend({ t: "start-failed", error } satisfies OnlineMessage);
      return;
    }
    const snap = useGame.getState().snapshot();
    if (!pile.length) {
      pile = songsFromBoard(snap.players, snap.current, snap.deck);
      online.setCupPile(pile);
    }
    tables[match.id] = snap;
    speakers[match.id] = match.playerIds[0] ?? "";
  }
  t = skipByes(t);
  online.setTournament(t);
  const boards = boardsOf(t, tables);
  online.setCupTables(tables, boards, speakers);
  pushCup();
  pushBoards(boards);
  online.markPlaying();
  if (parallel && batch.length > 1) {
    for (const match of batch) {
      const snap = tables[match.id];
      if (!snap) continue;
      pushTable(match.id, snap, match.playerIds);
    }
  } else {
    const focus = batch[0];
    if (focus && tables[focus.id]) {
      useGame.getState().applySnapshot(tables[focus.id]!);
      pushState();
    }
  }
  online.setPending(false);
}

function boardsOf(
  t: NonNullable<ReturnType<typeof useOnline.getState>["tournament"]>,
  tables: Record<string, GameSnapshot>,
): CupBoardCard[] {
  return liveMatches(t).map((match) =>
    boardFromSnapshot(match, t, tables[match.id], matchTitle(match, t)),
  );
}

function pushTable(matchId: string, snapshot: GameSnapshot, playerIds: string[]) {
  netSend({ t: "cup-table", matchId, snapshot } satisfies OnlineMessage);
  for (const id of playerIds) {
    netSend({ t: "state", snapshot } satisfies OnlineMessage, id);
  }
}

function pushBoards(boards: CupBoardCard[]) {
  netSend({ t: "cup-board", boards } satisfies OnlineMessage);
}

export function runCupAction(from: string, apply: () => void) {
  const online = useOnline.getState();
  const t = online.tournament;
  if (!TOURNAMENT_LIVE || !online.cup || online.cupFlow !== "par" || !t) {
    apply();
    pushState();
    return;
  }
  const match = matchOfPlayer(t, from);
  if (!match) return;
  const table = online.cupTables[match.id];
  if (table) useGame.getState().applySnapshot(table);
  apply();
  const snap = useGame.getState().snapshot();
  const tables = { ...online.cupTables, [match.id]: snap };
  const boards = t ? boardsOf(t, tables) : [];
  online.setCupTables(tables, boards);
  pushTable(match.id, snap, match.playerIds);
  pushBoards(boards);
  if (snap.phase === "winner") {
    const next = completeMatch(t, match.id, rankingFromSnap(snap));
    online.setTournament(next);
    pushCup();
  }
}

function rankingFromSnap(snap: GameSnapshot): MatchScore[] {
  return rankPlayers(snap.players).map((row) => ({
    id: row.id,
    name: row.name,
    cards: row.timeline.length,
    quiz: row.quiz ?? 0,
    misses: row.misses,
  }));
}

export function requestFinishCupMatch() {
  if (!TOURNAMENT_LIVE) return;
  const online = useOnline.getState();
  if (online.role !== "host") return;
  const t = online.tournament;
  if (!t) return;
  if (online.cupFlow === "par") {
    const snap = useGame.getState().snapshot();
    const match =
      liveMatches(t).find((row) => snap.players.some((p) => row.playerIds.includes(p.id))) ?? currentMatch(t);
    if (!match || match.status === "done") return;
    if (snap.phase !== "winner") return;
    const next = completeMatch(t, match.id, rankingFromSnap(snap));
    online.setTournament(next);
    pushCup();
    return;
  }
  const match = currentMatch(t);
  if (!match || match.status === "done") return;
  const next = completeMatch(t, match.id, rankingFromGame());
  online.setTournament(next);
  pushCup();
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
  if (useSessionExit.getState().kind === "evening") return;
  const series = useGame.getState().series;
  if (!series.length) return;
  useSessionExit.getState().showEvening(series);
  if (useOnline.getState().status !== "off") {
    noteDebug("out", "evening");
    netSend({ t: "evening", series } satisfies OnlineMessage);
  }
}

export function finishEvening() {
  useGame.getState().openHome();
  const online = useOnline.getState();
  if (online.status !== "off") {
    online.leaveRoom();
    clearRoomFromUrl();
  }
  useSessionExit.getState().clear();
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
  if (TOURNAMENT_LIVE && online.cup) return;
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

