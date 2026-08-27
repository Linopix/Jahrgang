import { useEffect, useRef } from "react";
import { useP2PRoom } from "@/lib/multiplayer";
import { p2pRoomId } from "@/lib/game/room-code";
import { isOnlineMessage, type MemberWire, type OnlineMessage, type RoomConfigWire } from "@/lib/game/protocol";
import { bindNet, netDrop } from "@/lib/game/net";
import { useGame } from "@/lib/game/store";
import { useOnline, type OnlineMember } from "@/lib/game/online-store";
import { requestStartOnline, runCupAction } from "@/lib/game/online-actions";
import { DEFAULT_NEXT_ROUND, DEFAULT_ROOM_CONFIG, DEFAULT_VARIANT, defaultTokensFor, isNextRoundPolicy, isPlayVariant, isTokenCount, parseCustom, parseStageAudio, parseSuggest } from "@/lib/game/types";
import { receiveReaction } from "@/lib/game/reactions";
import { applyChatDelete, receiveChat } from "@/lib/game/chat";
import { takeClaim, pickSuccessor } from "@/lib/tv/names";
import { safeName } from "@/lib/game/moderation";
import { HOST_GRACE_MS, shouldTakeHost, nextHostId, fromHost, fromControl, acceptsHostTake } from "@/lib/game/hosting";
import { bindMeshInspect, noteDebug } from "@/lib/game/debug";
import { useSessionExit } from "@/lib/game/session-exit";
import type { PeerInfo } from "@/lib/multiplayer";
import { TOURNAMENT_LIVE } from "@/lib/tournament/flags";
import { parseCupAudio, parseCupFlow, parseCupQualify, parseCupSize, parseTournament, matchOfPlayer } from "@/lib/tournament";
import { roomCap } from "@/lib/tv/mode";

const JOIN_TIMEOUT_MS = 14000;

function peerState(peer: PeerInfo | undefined): OnlineMember["connectionState"] {
  if (!peer) return "connecting";
  if (peer.connectionState === "connected") return "connected";
  if (peer.connectionState === "failed" || peer.connectionState === "disconnected") return "failed";
  return "connecting";
}

export function OnlineBridge() {
  const status = useOnline((s) => s.status);
  const roomCode = useOnline((s) => s.roomCode);
  const selfName = useOnline((s) => s.selfName);
  if (status === "off" || status === "entry" || !roomCode) return null;
  return <OnlineRoom key={roomCode} roomCode={roomCode} name={selfName} />;
}

function OnlineRoom({ roomCode, name }: { roomCode: string; name: string }) {
  const presetId = useOnline.getState().selfId;
  const p2p = useP2PRoom({ room: p2pRoomId(roomCode), name, selfId: presetId || undefined });
  const role = useOnline((s) => s.role);
  const members = useOnline((s) => s.members);
  const era = useOnline((s) => s.era);
  const target = useOnline((s) => s.target);
  const variant = useOnline((s) => s.variant);
  const tokens = useOnline((s) => s.tokens);
  const nextRound = useOnline((s) => s.nextRound);
  const playlistUrl = useOnline((s) => s.playlistUrl);
  const playlistLabel = useOnline((s) => s.playlistLabel);
  const mixFrom = useOnline((s) => s.mixFrom);
  const mixTo = useOnline((s) => s.mixTo);
  const mixGenre = useOnline((s) => s.mixGenre);
  const custom = useOnline((s) => s.custom);
  const extraEra = useOnline((s) => s.extraEra);
  const eras = useOnline((s) => s.eras);
  const pool = useOnline((s) => s.pool);
  const emoji = useOnline((s) => s.emoji);
  const chat = useOnline((s) => s.chat);
  const tv = useOnline((s) => s.tv);
  const suggest = useOnline((s) => s.suggest);
  const stageAudio = useOnline((s) => s.stageAudio);
  const cup = useOnline((s) => s.cup);
  const cupSize = useOnline((s) => s.cupSize);
  const cupQualify = useOnline((s) => s.cupQualify);
  const cupFlow = useOnline((s) => s.cupFlow);
  const cupAudio = useOnline((s) => s.cupAudio);
  const tournament = useOnline((s) => s.tournament);
  const hostId = useOnline((s) => s.hostId);
  const adminId = useOnline((s) => s.adminId);
  const tvStep = useOnline((s) => s.tvStep);
  const stagePlays = useOnline((s) => s.stagePlays);
  const status = useOnline((s) => s.status);
  const sendRef = useRef(p2p.send);
  sendRef.current = p2p.send;

  useEffect(() => {
    bindNet({ send: p2p.send, selfId: p2p.selfId, dropPeer: p2p.dropPeer });
    return () => bindNet(null);
  }, [p2p.send, p2p.selfId, p2p.dropPeer]);

  useEffect(() => {
    if (!TOURNAMENT_LIVE || !cup) {
      p2p.setHub(null);
      return;
    }
    const hub = role === "host" ? p2p.selfId : hostId;
    if (hub) p2p.setHub(hub);
  }, [cup, role, p2p.selfId, hostId, p2p.setHub]);

  useEffect(() => {
    bindMeshInspect(() => p2p.inspect());
    return () => bindMeshInspect(null);
  }, [p2p.inspect]);

  useEffect(() => {
    useOnline.setState({ selfId: p2p.selfId });
    if (role === "host") {
      useOnline.getState().setIdentity(p2p.selfId, true);
    }
  }, [p2p.selfId, role]);

  useEffect(() => {
    if (!p2p.joined) return;
    if (role === "guest") {
      p2p.send({ t: "hello", name, claim: useOnline.getState().claimIntent, resume: true });
    } else if (role === "host" && useGame.getState().phase === "home") {
      p2p.send({ t: "sync-request" });
    }
  }, [p2p.joined, p2p.send, role, name]);

  const hostWasLive = useRef(true);
  useEffect(() => {
    if (role !== "guest") {
      useOnline.getState().setHostLive(true);
      hostWasLive.current = true;
      return;
    }
    const hostId = useOnline.getState().hostId;
    const peer = p2p.peers.find((row) => row.id === hostId);
    const live = Boolean(peer && peer.connectionState === "connected");
    useOnline.getState().setHostLive(live);
    if (live && !hostWasLive.current && p2p.joined) {
      p2p.send({ t: "hello", name, resume: true, claim: useOnline.getState().claimIntent });
      noteDebug("note", "host-back", hostId);
    }
    hostWasLive.current = live;
  }, [p2p.peers, p2p.joined, p2p.send, role, name]);

  useEffect(() => {
    if (role === "host") return;
    const hostId = useOnline.getState().hostId;
    if (!hostId) return;
    const peer = p2p.peers.find((row) => row.id === hostId);
    const live = Boolean(peer && peer.connectionState === "connected");
    if (live) return;
    const timer = window.setTimeout(() => {
      const online = useOnline.getState();
      const roster = p2p.roster();
      const members =
        TOURNAMENT_LIVE && online.cup && roster.length
          ? [
              { id: p2p.selfId, live: true },
              ...roster
                .filter((row) => row.id !== p2p.selfId)
                .map((row) => ({ id: row.id, live: row.id !== online.hostId })),
            ]
          : [
              { id: p2p.selfId, live: true },
              ...p2p.peers.map((row) => ({
                id: row.id,
                live: row.connectionState === "connected",
              })),
            ];
      if (
        !shouldTakeHost({
          selfId: p2p.selfId,
          hostId: online.hostId,
          hostLive: false,
          members,
          tvId: online.tv ? online.hostId : "",
        })
      ) {
        const next = nextHostId(members, online.hostId, online.tv ? online.hostId : "");
        if (next && next !== p2p.selfId) {
          useOnline.setState({ hostId: next, hostLive: false });
          if (TOURNAMENT_LIVE && online.cup) p2p.setHub(next);
        }
        return;
      }
      const adminLive = members.some((row) => row.id === online.adminId && row.live);
      const oldHost = online.hostId;
      const wasTv = online.tv;
      const successor = p2p.selfId;
      online.becomeHost(adminLive ? online.adminId : successor);
      if (wasTv && oldHost !== p2p.selfId) {
        useOnline.setState({ tv: false, stagePlays: false });
      }
      p2p.setHub(p2p.selfId);
      noteDebug("note", "host-take", p2p.selfId);
      sendRef.current({
        t: "host-take",
        hostId: p2p.selfId,
        adminId: adminLive ? online.adminId : p2p.selfId,
      });
      const game = useGame.getState();
      if (game.phase === "listen" || game.phase === "reveal" || game.phase === "winner" || game.phase === "loading") {
        sendRef.current({ t: "state", snapshot: game.snapshot() });
      }
      if (TOURNAMENT_LIVE) {
        sendRef.current({ t: "cup", tournament: useOnline.getState().tournament });
      }
    }, HOST_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [p2p.peers, p2p.selfId, role, p2p.setHub, p2p.roster]);

  useEffect(() => {
    if (role !== "guest" || status !== "connecting") return;
    const timer = window.setTimeout(() => {
      const current = useOnline.getState();
      if (current.status === "connecting") {
        current.setError("Raum nicht gefunden oder Verbindung blockiert. Code prüfen und erneut versuchen.");
        current.leaveRoom();
        current.openEntry(roomCode);
      }
    }, JOIN_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [role, status, roomCode]);

  useEffect(() => {
    if (role !== "host") return;
    const selfId = p2p.selfId;
    const next: OnlineMember[] = [
      { id: selfId, name, connectionState: "self" },
    ];
    const known = new Map(useOnline.getState().members.map((m) => [m.id, m]));
    const kicked = new Set(useOnline.getState().kickedIds);
    for (const peer of p2p.peers) {
      if (kicked.has(peer.id)) continue;
      const prev = known.get(peer.id);
      const connected = peer.connectionState === "connected";
      next.push({
        id: peer.id,
        name: prev?.name || peer.name || "Gast",
        connectionState: peerState(peer),
        droppedAt: connected ? undefined : prev?.droppedAt ?? Date.now(),
      });
    }
    const now = Date.now();
    for (const prev of known.values()) {
      if (prev.id === selfId) continue;
      if (next.some((m) => m.id === prev.id)) continue;
      const droppedAt = prev.droppedAt ?? now;
      const wait = now - droppedAt < HOST_GRACE_MS || status === "playing";
      if (wait) {
        next.push({ ...prev, connectionState: "disconnected", droppedAt });
      }
    }
    useOnline.getState().setMembers(next.slice(0, roomCap(useOnline.getState().cup)));
    const state = useOnline.getState();
    if (state.adminId) {
      const admin = next.find((row) => row.id === state.adminId);
      const gone =
        !admin ||
        admin.connectionState === "failed" ||
        admin.connectionState === "disconnected";
      if (gone) {
        const successor = pickSuccessor(
          next.map((row) => ({
            id: row.id,
            live: row.connectionState !== "failed" && row.connectionState !== "disconnected",
          })),
          state.adminId,
          state.tv ? selfId : "",
        );
        if (successor && successor !== state.adminId) state.setAdminId(successor);
      }
    }
    if (status === "playing") {
      const game = useGame.getState();
      const current = game.players[game.currentPlayerIndex];
      const liveIds = new Set(
        next
          .filter((row) => row.connectionState !== "failed" && row.connectionState !== "disconnected")
          .map((row) => row.id),
      );
      const currentGone = Boolean(current && !liveIds.has(current.id));
      const someoneLive = game.players.some((row) => liveIds.has(row.id));
      if (currentGone && someoneLive && (game.phase === "listen" || game.phase === "reveal")) {
        game.nextTurn({
          skipIds: next
            .filter((row) => row.connectionState === "failed" || row.connectionState === "disconnected")
            .map((row) => row.id),
        });
        sendRef.current({ t: "state", snapshot: useGame.getState().snapshot() });
      }
    }
  }, [p2p.peers, p2p.selfId, name, role, status]);

  useEffect(() => {
    if (role !== "host" || status === "connecting") return;
    const wire: MemberWire[] = useOnline.getState().members.map((m) => ({
      id: m.id,
      name: m.name,
    }));
    const msg: OnlineMessage = {
      t: "lobby",
      hostId: p2p.selfId,
      adminId: useOnline.getState().adminId || p2p.selfId,
      tvStep: useOnline.getState().tvStep,
      members: wire,
      era,
      target,
      variant,
      tokens,
      nextRound,
      playlistUrl,
      playlistLabel,
      mixFrom,
      mixTo,
      mixGenre,
      custom,
      extraEra,
      eras,
      pool,
      emoji,
      chat,
      tv,
      stagePlays: useOnline.getState().stagePlays,
      suggest,
      stageAudio,
      cup,
      cupSize,
      cupQualify,
      cupFlow,
      cupAudio,
      tournament: TOURNAMENT_LIVE ? useOnline.getState().tournament : null,
    };
    p2p.send(msg);
  }, [role, status, p2p.selfId, p2p.send, p2p.peers, era, target, variant, tokens, nextRound, playlistUrl, playlistLabel, mixFrom, mixTo, mixGenre, custom, extraEra, eras, pool, emoji, chat, tv, members, adminId, tvStep, stagePlays, suggest, stageAudio, cup, cupSize, cupQualify, cupFlow, cupAudio, tournament]);

  useEffect(() => {
    return p2p.onMessage((from, data, channel) => {
      if (channel !== "reliable" || !isOnlineMessage(data)) return;
      handleMessage(from, data, {
        selfId: p2p.selfId,
        send: sendRef.current,
        skipIds: disconnectedIds(p2p.peers, p2p.selfId),
      });
    });
  }, [p2p.onMessage, p2p.selfId, p2p.peers]);

  return null;
}

function disconnectedIds(peers: PeerInfo[], selfId: string) {
  const live = new Set(
    peers.filter((p) => p.connectionState === "connected").map((p) => p.id),
  );
  live.add(selfId);
  return useOnline
    .getState()
    .members.filter((m) => m.id !== selfId && !live.has(m.id))
    .map((m) => m.id);
}

function roomConfigFromWire(msg: RoomConfigWire) {
  return {
    era: msg.era,
    target: msg.target,
    variant: isPlayVariant(msg.variant) ? msg.variant : DEFAULT_VARIANT,
    tokens: isTokenCount(msg.tokens)
      ? msg.tokens
      : defaultTokensFor(isPlayVariant(msg.variant) ? msg.variant : DEFAULT_VARIANT),
    nextRound: isNextRoundPolicy(msg.nextRound) ? msg.nextRound : DEFAULT_NEXT_ROUND,
    playlistUrl: msg.playlistUrl ?? "",
    playlistLabel: msg.playlistLabel ?? "",
    mixFrom: msg.mixFrom ?? DEFAULT_ROOM_CONFIG.mixFrom,
    mixTo: msg.mixTo ?? DEFAULT_ROOM_CONFIG.mixTo,
    mixGenre: msg.mixGenre ?? "all",
    custom: parseCustom(msg.custom),
    extraEra: msg.extraEra ?? null,
    eras: msg.eras ?? [],
    pool: msg.pool ?? DEFAULT_ROOM_CONFIG.pool,
    emoji: msg.emoji !== false,
    chat: msg.chat !== false,
    tv: Boolean(msg.tv),
    suggest: parseSuggest(msg.suggest),
    stageAudio: parseStageAudio(msg.stageAudio),
    cup: TOURNAMENT_LIVE && Boolean(msg.cup),
    cupSize: parseCupSize(msg.cupSize),
    cupQualify: parseCupQualify(msg.cupQualify),
    cupFlow: parseCupFlow(msg.cupFlow),
    cupAudio: parseCupAudio(msg.cupAudio, parseCupFlow(msg.cupFlow)),
  };
}

function liveRoster(selfId: string, hostId: string) {
  const online = useOnline.getState();
  return [
    { id: selfId, live: true },
    ...online.members.map((row) => ({
      id: row.id,
      live: row.id !== hostId && row.connectionState !== "failed" && row.connectionState !== "disconnected",
    })),
  ];
}

function handleMessage(
  from: string,
  msg: OnlineMessage,
  ctx: { selfId: string; send: (data: unknown, peerId?: string) => void; skipIds: string[] },
) {
  const online = useOnline.getState();
  const game = useGame.getState();
  noteDebug("in", msg.t, from);

  if (msg.t === "hello" && online.role === "host") {
    if (online.kickedIds.includes(from)) {
      ctx.send({ t: "kick" }, from);
      return;
    }
    const members = online.members.slice();
    const existing = members.find((m) => m.id === from);
    if (online.status === "playing" && !existing && !msg.resume) {
      ctx.send({ t: "start-failed", error: "Die Runde läuft bereits." }, from);
      return;
    }
    const name = safeName(msg.name || "", "Gast");
    if (existing) {
      existing.name = name;
      existing.connectionState = "connected";
      existing.droppedAt = undefined;
    } else if (members.length < roomCap(online.cup)) {
      members.push({ id: from, name, connectionState: "connecting" });
    }
    online.setMembers(members);
    if (online.status === "playing") {
      ctx.send({ t: "state", snapshot: useGame.getState().snapshot() }, from);
      const match = matchOfPlayer(online.tournament, from);
      const table = match ? online.cupTables[match.id] : null;
      if (TOURNAMENT_LIVE && online.cup && match && table) {
        ctx.send({ t: "state", snapshot: table }, from);
        ctx.send({ t: "cup-table", matchId: match.id, snapshot: table }, from);
      }
      if (TOURNAMENT_LIVE && online.cupBoards?.length) {
        ctx.send({ t: "cup-board", boards: online.cupBoards }, from);
      }
    }
    if (TOURNAMENT_LIVE && online.tournament) {
      ctx.send({ t: "cup", tournament: online.tournament }, from);
    }
    if (online.tv && online.claimOpen) {
      const claimed = takeClaim({
        claimOpen: true,
        tvId: ctx.selfId,
        adminId: online.adminId || ctx.selfId,
        from,
      });
      if (claimed) {
        useOnline.setState(claimed);
      }
    }
    return;
  }

  if (msg.t === "lobby") {
    if (msg.hostId === ctx.selfId) return;
    if (from !== msg.hostId) return;
    if (online.role === "host" && from !== ctx.selfId) return;
    online.setMembers(
      msg.members.map((m) => ({
        id: m.id,
        name: safeName(m.name, "Gast"),
        connectionState: m.id === ctx.selfId ? "self" : "connected",
      })),
    );
    online.setConfig(roomConfigFromWire(msg));
    useOnline.setState({
      hostId: msg.hostId,
      adminId: msg.adminId || msg.hostId,
      tvStep: msg.tvStep ?? (msg.tv ? "invite" : "invite"),
      stagePlays: Boolean(msg.stagePlays),
    });
    if (TOURNAMENT_LIVE) {
      online.setTournament(parseTournament(msg.tournament) ?? msg.tournament ?? null);
    }
    if (online.status === "connecting" || online.status === "entry") {
      online.markLobby();
    }
    online.persistSeat();
    return;
  }

  if (msg.t === "config") {
    if (online.role === "guest") {
      if (!fromControl(from, online.hostId, online.adminId)) return;
      online.setConfig(roomConfigFromWire(msg));
      if (typeof msg.stagePlays === "boolean") useOnline.setState({ stagePlays: msg.stagePlays });
      return;
    }
    if (from === online.adminId) {
      online.setConfig(roomConfigFromWire(msg));
      if (typeof msg.stagePlays === "boolean") online.setStagePlays(msg.stagePlays);
    }
    return;
  }

  if (msg.t === "pass-admin") {
    const next = msg.id;
    if (!next || next === online.adminId) return;
    if (!online.members.some((row) => row.id === next)) return;
    if (online.role === "host") {
      if (from !== online.adminId && from !== ctx.selfId) return;
      online.setAdminId(next);
      ctx.send({ t: "pass-admin", id: next });
      return;
    }
    if (from !== online.hostId && from !== online.adminId) return;
    online.setAdminId(next);
    return;
  }

  if (msg.t === "loading" && online.role === "guest") {
    if (!fromHost(from, online.hostId) && !fromControl(from, online.hostId, online.adminId)) return;
    useGame.setState({ phase: "loading", loadProgress: { done: 0, total: 1 } });
    online.markPlaying();
    return;
  }

  if (msg.t === "start-failed") {
    if (!fromControl(from, online.hostId, online.adminId)) return;
    game.resetBoard();
    if (online.status === "connecting" || online.status === "entry") {
      online.leaveRoom();
      online.openEntry();
      online.setError(msg.error);
      return;
    }
    online.markLobby();
    online.setError(msg.error);
    return;
  }

  if (msg.t === "state") {
    if (online.role === "host") return;
    if (!fromHost(from, online.hostId)) return;
    game.applySnapshot(msg.snapshot);
    online.markPlaying();
    online.setPending(false);
    return;
  }

  if (msg.t === "back-lobby") {
    if (online.role === "host") {
      if (from === ctx.selfId) return;
      if (from !== online.adminId && online.nextRound !== "all") return;
      game.resetBoard();
      online.markLobby();
      if (online.tv) online.setTvStep("invite");
      ctx.send({ t: "back-lobby" });
      return;
    }
    if (from !== online.hostId && from !== online.adminId) return;
    game.resetBoard();
    online.markLobby();
    if (online.tv) online.setTvStep("invite");
    return;
  }

  if (msg.t === "again") {
    if (online.role !== "host") return;
    if (from !== online.adminId && online.nextRound !== "all") return;
    void requestStartOnline();
    return;
  }

  if (msg.t === "kick" && online.role === "guest") {
    if (!fromControl(from, online.hostId, online.adminId)) return;
    const code = online.roomCode;
    game.resetBoard();
    online.leaveRoom();
    online.openEntry(code);
    online.setError("Der Host hat dich aus dem Raum genommen. Namen prüfen und erneut beitreten.");
    return;
  }

  if (msg.t === "host-left") {
    if (from !== online.hostId) return;
    const members = [
      { id: ctx.selfId, live: true },
      ...online.members.map((row) => ({
        id: row.id,
        live: row.id !== from && row.connectionState !== "failed" && row.connectionState !== "disconnected",
      })),
    ];
    if (
      shouldTakeHost({
        selfId: ctx.selfId,
        hostId: from,
        hostLive: false,
        members,
        tvId: online.tv ? from : "",
      })
    ) {
      const adminLive = members.some((row) => row.id === online.adminId && row.live);
      online.becomeHost(adminLive ? online.adminId : ctx.selfId);
      if (online.tv) useOnline.setState({ tv: false, stagePlays: false });
      ctx.send({
        t: "host-take",
        hostId: ctx.selfId,
        adminId: adminLive ? online.adminId : ctx.selfId,
      });
    }
    return;
  }

  if (msg.t === "host-take") {
    if (!msg.hostId) return;
    if (
      !acceptsHostTake({
        from,
        claimedId: msg.hostId,
        hostId: online.hostId,
        hostLive: online.hostLive,
        members: liveRoster(ctx.selfId, online.hostId),
        tvId: online.tv ? online.hostId : "",
      })
    ) {
      return;
    }
    if (msg.hostId === ctx.selfId) {
      online.becomeHost(msg.adminId);
      return;
    }
    useOnline.setState({
      role: "guest",
      hostId: msg.hostId,
      adminId: msg.adminId || msg.hostId,
      hostLive: true,
    });
    if (TOURNAMENT_LIVE && useOnline.getState().cup) {
      // Hub is set by the effect on hostId.
    }
    online.persistSeat();
    return;
  }

  if (msg.t === "sync-request") {
    const ids = [ctx.selfId, ...online.members.map((row) => row.id)]
      .filter((id) => id !== from)
      .sort();
    if (ids[0] !== ctx.selfId) return;
    if (
      game.phase === "listen" ||
      game.phase === "reveal" ||
      game.phase === "winner" ||
      game.phase === "loading"
    ) {
      ctx.send({ t: "state", snapshot: game.snapshot() }, from);
    }
    const cupState = useOnline.getState().tournament;
    if (TOURNAMENT_LIVE && cupState) {
      ctx.send({ t: "cup", tournament: cupState }, from);
    }
    return;
  }

  if (msg.t === "evening") {
    if (from !== online.hostId && from !== online.adminId && from !== ctx.selfId) return;
    const series = msg.series?.length ? msg.series : game.series;
    if (!series.length) return;
    useSessionExit.getState().showEvening(series);
    return;
  }

  if (msg.t === "cup") {
    if (!TOURNAMENT_LIVE) return;
    if (online.role === "host" && from !== ctx.selfId) return;
    if (online.role !== "host" && !fromHost(from, online.hostId)) return;
    online.setTournament(parseTournament(msg.tournament) ?? msg.tournament ?? null);
    return;
  }

  if (msg.t === "cup-table") {
    if (!TOURNAMENT_LIVE) return;
    if (online.role === "host" && from !== ctx.selfId) return;
    if (online.role !== "host" && !fromHost(from, online.hostId)) return;
    const tables = { ...online.cupTables, [msg.matchId]: msg.snapshot };
    online.setCupTables(tables);
    const self = online.selfId;
    if (self && msg.snapshot.players.some((row) => row.id === self)) {
      useGame.getState().applySnapshot(msg.snapshot);
      online.markPlaying();
    }
    return;
  }

  if (msg.t === "cup-board") {
    if (!TOURNAMENT_LIVE) return;
    if (online.role === "host" && from !== ctx.selfId) return;
    if (online.role !== "host" && !fromHost(from, online.hostId)) return;
    useOnline.setState({ cupBoards: msg.boards });
    return;
  }

  if (msg.t === "react") {
    const who = msg.by || from;
    if (who === ctx.selfId) return;
    const member = online.members.find((row) => row.id === who);
    receiveReaction(msg.emoji, member?.name ?? "");
    if (online.role === "host" && TOURNAMENT_LIVE && online.cup && !msg.by) {
      ctx.send({ t: "react", emoji: msg.emoji, by: from });
    }
    return;
  }

  if (msg.t === "chat") {
    const who = msg.by || from;
    if (who === ctx.selfId) return;
    const member = online.members.find((row) => row.id === who);
    receiveChat(msg.text, member?.name ?? "Gast", who, msg.id);
    if (online.role === "host" && TOURNAMENT_LIVE && online.cup && !msg.by) {
      ctx.send({ t: "chat", text: msg.text, id: msg.id, by: from });
    }
    return;
  }

  if (msg.t === "chat-del") {
    if (from === ctx.selfId) return;
    applyChatDelete(msg.id, from);
    return;
  }

  if (msg.t === "aim") {
    const who = msg.by || from;
    const current = game.players[game.currentPlayerIndex];
    if (!current || current.id !== who) return;
    if (who === ctx.selfId) return;
    if (game.phase !== "listen") return;
    if (msg.slot !== null && (typeof msg.slot !== "number" || msg.slot < 0 || msg.slot > current.timeline.length)) {
      return;
    }
    useGame.setState({ selectedSlot: msg.slot });
    if (online.role === "host" && TOURNAMENT_LIVE && online.cup && !msg.by) {
      ctx.send({ t: "aim", slot: msg.slot, by: from });
    }
    return;
  }

  if (msg.t === "action" && msg.kind === "end" && online.role === "host") {
    if (from !== online.adminId && from !== ctx.selfId) return;
    game.endGame();
    ctx.send({ t: "state", snapshot: useGame.getState().snapshot() });
    return;
  }

  if (msg.t === "admin-start" && online.role === "host") {
    if (online.cup) return;
    if (from !== online.adminId) return;
    void requestStartOnline();
    return;
  }

  if (msg.t === "admin-kick" && online.role === "host") {
    if (from !== online.adminId) return;
    const peerId = msg.id;
    if (!peerId || peerId === ctx.selfId || peerId === from) return;
    ctx.send({ t: "kick" }, peerId);
    useOnline.setState({
      kickedIds: [...new Set([...online.kickedIds, peerId])],
      members: online.members.filter((row) => row.id !== peerId),
    });
    window.setTimeout(() => netDrop(peerId), 80);
    return;
  }

  if (msg.t === "tv-step") {
    if (online.role === "host") {
      if (from !== online.adminId) return;
      online.setTvStep(msg.step);
      return;
    }
    if (from !== online.hostId && from !== online.adminId) return;
    online.setTvStep(msg.step);
    return;
  }

  if (msg.t === "action" && online.role === "host") {
    const apply = () => {
      const current = useGame.getState().players[useGame.getState().currentPlayerIndex];
      if (!current || current.id !== from) return;
      if (msg.kind === "place") {
        if (typeof msg.slot !== "number") return;
        useGame.setState({ selectedSlot: msg.slot });
        useGame.getState().confirmPlacement({ title: msg.title ?? "", artist: msg.artist ?? "" });
      } else if (msg.kind === "decade") {
        useGame.getState().useDecade();
      } else if (msg.kind === "skip") {
        useGame.getState().useSkip();
      } else if (msg.kind === "next") {
        useGame.getState().nextTurn({ skipIds: ctx.skipIds });
      }
    };
    if (TOURNAMENT_LIVE && online.cup && online.cupFlow === "par") {
      runCupAction(from, apply);
      return;
    }
    apply();
    ctx.send({ t: "state", snapshot: useGame.getState().snapshot() });
  }
}

export function broadcastState() {
  // Host-only helper used by UI after local actions.
}

export function hostSend(msg: OnlineMessage) {
  void msg;
}
