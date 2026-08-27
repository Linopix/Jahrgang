import { useEffect } from "react";
import { useDebug, readMeshInspect } from "@/lib/game/debug";
import { useOnline } from "@/lib/game/online-store";
import { useGame } from "@/lib/game/store";
import { isAdmin } from "@/lib/tv/mode";

function ago(at: number) {
  if (!at) return "—";
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  return `${s}s`;
}

export function DebugOverlay() {
  const open = useDebug((s) => s.open);
  const mesh = useDebug((s) => s.mesh);
  const lines = useDebug((s) => s.lines);
  const setMesh = useDebug((s) => s.setMesh);
  const setOpen = useDebug((s) => s.setOpen);
  const online = useOnline.getState();
  const game = useGame.getState();
  const phase = game.phase;
  const current = game.currentPlayerIndex;
  const players = game.players;

  useEffect(() => {
    if (!open) return;
    const tick = () => setMesh(readMeshInspect());
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, [open, setMesh]);

  if (!open) return null;

  const text = [
    `self ${online.selfId || "—"}  role ${online.role ?? "off"}  admin ${isAdmin() ? "yes" : "no"}`,
    `room ${online.roomCode || "—"}  host ${online.hostId || "—"}  adminId ${online.adminId || "—"}`,
    `status ${online.status}  tv ${online.tv ? "yes" : "no"}  hostLive ${online.hostLive ? "yes" : "no"}`,
    `phase ${phase}  turn ${current}  players ${players.map((p) => p.id.slice(-4)).join(",")}`,
    mesh
      ? `mesh ${mesh.room}  poll ${mesh.everPolled ? "ok" : "…"}  cursor ${mesh.cursor}  closed ${mesh.closed}`
      : "mesh —",
    ...(mesh?.peers ?? []).map(
      (peer) =>
        `${peer.name || peer.id}  ${peer.connectionState}/${peer.iceConnectionState}  rtt ${peer.rttMs ?? "—"}  ${peer.candidateType ?? "?"}  ch ${peer.channels.state}/${peer.channels.reliable}  rec ${peer.recoveryAttempts}${peer.terminal ? " T" : ""}  idle ${ago(peer.lastProgressAt)}`,
    ),
    "",
    ...lines
      .slice(-16)
      .map((line) => `${new Date(line.at).toISOString().slice(11, 19)} ${line.dir} ${line.kind} ${line.detail}`),
  ].join("\n");

  return (
    <div className="fixed inset-x-2 bottom-2 z-[80] max-h-[min(28rem,70dvh)] overflow-hidden rounded-md bg-canvas/95 p-3 font-mono text-[0.7rem] leading-relaxed text-fg shadow-lift sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[28rem]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Nadel</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-[0.65rem] tracking-[0.12em] text-subtle uppercase transition-colors duration-150 ease-out hover:text-fg"
            onClick={() => void navigator.clipboard?.writeText(text)}
          >
            Kopieren
          </button>
          <button
            type="button"
            className="text-[0.65rem] tracking-[0.12em] text-subtle uppercase transition-colors duration-150 ease-out hover:text-fg"
            onClick={() => setOpen(false)}
          >
            Zu
          </button>
        </div>
      </div>
      <pre className="max-h-[min(24rem,62dvh)] overflow-auto whitespace-pre-wrap text-muted">{text}</pre>
    </div>
  );
}
