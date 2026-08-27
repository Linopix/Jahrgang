import { useEffect, useRef } from "react";
import { useP2PRoom } from "@/lib/multiplayer";
import { clearRoomFromUrl, p2pRoomId } from "@/lib/game/room-code";
import { isOnlineMessage, type MemberWire, type OnlineMessage } from "@/lib/game/protocol";
import { bindNet, netDrop } from "@/lib/game/net";
import { useGame } from "@/lib/game/store";
import { useOnline, type OnlineMember } from "@/lib/game/online-store";
import { requestStartOnline } from "@/lib/game/online-actions";
import { DEFAULT_NEXT_ROUND, DEFAULT_ROOM_CONFIG, DEFAULT_TOKENS, DEFAULT_VARIANT, isNextRoundPolicy, isPlayVariant, isTokenCount, parseCustom } from "@/lib/game/types";
import { receiveReaction } from "@/lib/game/reactions";
import { receiveChat } from "@/lib/game/chat";
import { takeClaim } from "@/lib/tv/names";
import type { PeerInfo } from "@/lib/multiplayer";

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
  const p2p = useP2PRoom({ room: p2pRoomId(roomCode), name });
  const role = useOnline((s) => s.role);
  const hostId = useOnline((s) => s.hostId);
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
  const pool = useOnline((s) => s.pool);
  const emoji = useOnline((s) => s.emoji);
  const chat = useOnline((s) => s.chat);
  const tv = useOnline((s) => s.tv);
  const adminId = useOnline((s) => s.adminId);
  const tvStep = useOnline((s) => s.tvStep);
  const status = useOnline((s) => s.status);
  const sendRef = useRef(p2p.send);
  sendRef.current = p2p.send;

  useEffect(() => {
    bindNet({ send: p2p.send, selfId: p2p.selfId, dropPeer: p2p.dropPeer });
    return () => bindNet(null);
  }, [p2p.send, p2p.selfId, p2p.dropPeer]);

  useEffect(() => {
    useOnline.setState({ selfId: p2p.selfId });
    if (role === "host") {
      useOnline.getState().setIdentity(p2p.selfId, true);
    }
  }, [p2p.selfId, role]);

  useEffect(() => {
    if (!p2p.joined) return;
    if (role === "guest") {
      p2p.send({ t: "hello", name, claim: useOnline.getState().claimIntent });
    }
  }, [p2p.joined, p2p.send, role, name]);

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
      next.push({
        id: peer.id,
        name: prev?.name || peer.name || "Gast",
        connectionState: peerState(peer),
      });
    }
    for (const prev of known.values()) {
      if (prev.id === selfId) continue;
      if (next.some((m) => m.id === prev.id)) continue;
      if (status === "playing") {
        next.push({ ...prev, connectionState: "disconnected" });
      }
    }
    useOnline.getState().setMembers(next.slice(0, 8));
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
      pool,
      emoji,
      chat,
      tv,
    };
    p2p.send(msg);
  }, [role, status, p2p.selfId, p2p.send, p2p.peers, era, target, variant, tokens, nextRound, playlistUrl, playlistLabel, mixFrom, mixTo, mixGenre, custom, extraEra, pool, emoji, chat, tv, members, adminId, tvStep]);

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

  useEffect(() => {
    if (role !== "guest") return;
    const hostPeer = p2p.peers.find((p) => p.id === hostId);
    if (hostPeer?.connectionState === "failed") {
      useOnline.getState().setError("Verbindung zum Host fehlgeschlagen. Anderes Netz versuchen.");
    }
  }, [p2p.peers, hostId, role]);

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

function handleMessage(
  from: string,
  msg: OnlineMessage,
  ctx: { selfId: string; send: (data: unknown, peerId?: string) => void; skipIds: string[] },
) {
  const online = useOnline.getState();
  const game = useGame.getState();

  if (msg.t === "hello" && online.role === "host") {
    if (online.kickedIds.includes(from)) {
      ctx.send({ t: "kick" }, from);
      return;
    }
    if (online.status === "playing") {
      ctx.send({ t: "start-failed", error: "Die Runde läuft bereits." }, from);
      return;
    }
    const members = online.members.slice();
    const existing = members.find((m) => m.id === from);
    if (existing) {
      existing.name = msg.name || existing.name;
    } else if (members.length < 8) {
      members.push({ id: from, name: msg.name || "Gast", connectionState: "connecting" });
    }
    online.setMembers(members);
    if (online.tv && msg.claim) {
      const claimed = takeClaim({
        claimOpen: online.claimOpen,
        wantsClaim: true,
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

  if (msg.t === "lobby" && online.role === "guest") {
    online.setMembers(
      msg.members.map((m) => ({
        id: m.id,
        name: m.name,
        connectionState: m.id === ctx.selfId ? "self" : "connected",
      })),
    );
    online.setConfig({
      era: msg.era,
      target: msg.target,
      variant: isPlayVariant(msg.variant) ? msg.variant : DEFAULT_VARIANT,
      tokens: isTokenCount(msg.tokens) ? msg.tokens : DEFAULT_TOKENS,
      nextRound: isNextRoundPolicy(msg.nextRound) ? msg.nextRound : DEFAULT_NEXT_ROUND,
      playlistUrl: msg.playlistUrl ?? "",
      playlistLabel: msg.playlistLabel ?? "",
      mixFrom: msg.mixFrom ?? DEFAULT_ROOM_CONFIG.mixFrom,
      mixTo: msg.mixTo ?? DEFAULT_ROOM_CONFIG.mixTo,
      mixGenre: msg.mixGenre ?? "all",
      custom: parseCustom(msg.custom),
      extraEra: msg.extraEra ?? null,
      pool: msg.pool ?? DEFAULT_ROOM_CONFIG.pool,
      emoji: msg.emoji !== false,
      chat: msg.chat !== false,
      tv: Boolean(msg.tv),
    });
    useOnline.setState({
      hostId: msg.hostId,
      adminId: msg.adminId || msg.hostId,
      tvStep: msg.tvStep ?? (msg.tv ? "invite" : "invite"),
    });
    if (online.status === "connecting" || online.status === "entry") {
      online.markLobby();
    }
    return;
  }

  if (msg.t === "config") {
    if (online.role === "guest") {
      online.setConfig({
        era: msg.era,
        target: msg.target,
        variant: isPlayVariant(msg.variant) ? msg.variant : DEFAULT_VARIANT,
        tokens: isTokenCount(msg.tokens) ? msg.tokens : DEFAULT_TOKENS,
        nextRound: isNextRoundPolicy(msg.nextRound) ? msg.nextRound : DEFAULT_NEXT_ROUND,
        playlistUrl: msg.playlistUrl ?? "",
        playlistLabel: msg.playlistLabel ?? "",
        mixFrom: msg.mixFrom ?? DEFAULT_ROOM_CONFIG.mixFrom,
        mixTo: msg.mixTo ?? DEFAULT_ROOM_CONFIG.mixTo,
        mixGenre: msg.mixGenre ?? "all",
        custom: parseCustom(msg.custom),
        extraEra: msg.extraEra ?? null,
        pool: msg.pool ?? DEFAULT_ROOM_CONFIG.pool,
        emoji: msg.emoji !== false,
        chat: msg.chat !== false,
        tv: Boolean(msg.tv),
      });
      return;
    }
    if (from === online.adminId) {
      online.setConfig({
        era: msg.era,
        target: msg.target,
        variant: isPlayVariant(msg.variant) ? msg.variant : DEFAULT_VARIANT,
        tokens: isTokenCount(msg.tokens) ? msg.tokens : DEFAULT_TOKENS,
        nextRound: isNextRoundPolicy(msg.nextRound) ? msg.nextRound : DEFAULT_NEXT_ROUND,
        playlistUrl: msg.playlistUrl ?? "",
        playlistLabel: msg.playlistLabel ?? "",
        mixFrom: msg.mixFrom ?? DEFAULT_ROOM_CONFIG.mixFrom,
        mixTo: msg.mixTo ?? DEFAULT_ROOM_CONFIG.mixTo,
        mixGenre: msg.mixGenre ?? "all",
        custom: parseCustom(msg.custom),
        extraEra: msg.extraEra ?? null,
        pool: msg.pool ?? DEFAULT_ROOM_CONFIG.pool,
        emoji: msg.emoji !== false,
        chat: msg.chat !== false,
        tv: Boolean(msg.tv),
      });
    }
    return;
  }

  if (msg.t === "loading" && online.role === "guest") {
    useGame.setState({ phase: "loading", loadProgress: { done: 0, total: 1 } });
    online.markPlaying();
    return;
  }

  if (msg.t === "start-failed") {
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
    const code = online.roomCode;
    game.resetBoard();
    online.leaveRoom();
    online.openEntry(code);
    online.setError("Der Host hat dich aus dem Raum genommen. Namen prüfen und erneut beitreten.");
    return;
  }

  if (msg.t === "host-left") {
    game.resetBoard();
    online.setError("Der Host hat den Raum verlassen.");
    online.leaveRoom();
    online.openEntry();
    clearRoomFromUrl();
    return;
  }

  if (msg.t === "react") {
    if (from === ctx.selfId) return;
    const member = online.members.find((row) => row.id === from);
    receiveReaction(msg.emoji, member?.name ?? "");
    return;
  }

  if (msg.t === "chat") {
    if (from === ctx.selfId) return;
    const member = online.members.find((row) => row.id === from);
    receiveChat(msg.text, member?.name ?? "Gast");
    return;
  }

  if (msg.t === "action" && msg.kind === "end" && online.role === "host") {
    if (from !== online.adminId && from !== ctx.selfId) return;
    game.endGame();
    ctx.send({ t: "state", snapshot: useGame.getState().snapshot() });
    return;
  }

  if (msg.t === "admin-start" && online.role === "host") {
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
    const current = game.players[game.currentPlayerIndex];
    if (!current || current.id !== from) return;
    if (msg.kind === "place") {
      if (typeof msg.slot !== "number") return;
      useGame.setState({ selectedSlot: msg.slot });
      game.confirmPlacement({ title: msg.title ?? "", artist: msg.artist ?? "" });
    } else if (msg.kind === "decade") {
      game.useDecade();
    } else if (msg.kind === "skip") {
      game.useSkip();
    } else if (msg.kind === "next") {
      game.nextTurn({ skipIds: ctx.skipIds });
    }
    ctx.send({ t: "state", snapshot: useGame.getState().snapshot() });
  }
}

export function broadcastState() {
  // Host-only helper used by UI after local actions.
}

export function hostSend(msg: OnlineMessage) {
  void msg;
}
