import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shareUrl } from "@/lib/game/room-code";
import { requestConfig, requestLeave, requestStartOnline } from "@/lib/game/online-actions";
import { useOnline } from "@/lib/game/online-store";
import { ERA_LABELS, TARGET_OPTIONS, type EraId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const ERAS = Object.keys(ERA_LABELS) as EraId[];

export function OnlineLobbyScreen() {
  const role = useOnline((s) => s.role);
  const status = useOnline((s) => s.status);
  const roomCode = useOnline((s) => s.roomCode);
  const members = useOnline((s) => s.members);
  const era = useOnline((s) => s.era);
  const target = useOnline((s) => s.target);
  const error = useOnline((s) => s.error);
  const hostId = useOnline((s) => s.hostId);
  const pending = useOnline((s) => s.pending);
  const isHost = role === "host";
  const connecting = status === "connecting";
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const link = shareUrl(roomCode);

  useEffect(() => {
    if (!roomCode || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("room") === roomCode) return;
    url.searchParams.set("room", roomCode);
    window.history.replaceState(null, "", url.toString());
  }, [roomCode]);

  async function copy(kind: "code" | "link") {
    const value = kind === "code" ? roomCode : link;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt("Kopieren:", value);
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const readyCount = members.filter((m) => m.connectionState !== "failed").length;
  const canStart = !connecting && !pending && readyCount >= 2;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <button
        type="button"
        onClick={() => requestLeave()}
        className="self-start text-sm text-muted transition-colors hover:text-fg"
      >
        Raum verlassen
      </button>

      <p className="mt-6 text-xs font-medium tracking-[0.24em] text-muted uppercase">
        {isHost ? "Du hostest" : "Du bist dabei"}
      </p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">Lobby</h1>
      <p className="mt-2 text-sm text-muted">
        {connecting
          ? isHost
            ? "Raum wird geöffnet…"
            : `Verbinde mit ${roomCode}…`
          : "Code in Discord posten. Alle bleiben in ihrem Call — hier nur das Spiel."}
      </p>

      <section className="mt-8 rounded-xl bg-surface px-5 py-6 text-center shadow-border">
        <p className="text-xs tracking-[0.22em] text-muted uppercase">Raumcode</p>
        <p className="mt-3 font-mono text-5xl tracking-[0.28em] text-fg">{roomCode || "····"}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={() => void copy("code")}>
            {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === "code" ? "Code kopiert" : "Code kopieren"}
          </Button>
          <Button className="flex-1" onClick={() => void copy("link")}>
            {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copied === "link" ? "Link kopiert" : "Discord-Link"}
          </Button>
        </div>
      </section>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">Im Raum</h2>
          <p className="text-xs tabular-nums text-subtle">{readyCount}/8</p>
        </div>
        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm shadow-border"
            >
              <span className="truncate font-medium text-fg">
                {member.name}
                {member.connectionState === "self" ? (
                  <span className="ml-2 text-xs font-normal text-muted">du</span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-xs",
                  member.connectionState === "failed"
                    ? "text-danger"
                    : member.connectionState === "connecting"
                      ? "text-muted"
                      : "text-success",
                )}
              >
                {member.id === hostId
                  ? "Host"
                  : member.connectionState === "failed"
                    ? "blockiert"
                    : member.connectionState === "connecting"
                      ? "verbindet…"
                      : "verbunden"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {isHost ? (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-medium text-fg">Ziel</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TARGET_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => requestConfig(era, value)}
                  className={cn(
                    "h-12 rounded-md text-sm font-medium transition-colors",
                    target === value
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-fg shadow-border hover:bg-surface",
                  )}
                >
                  {value} Karten
                </button>
              ))}
            </div>
          </section>
          <section className="mt-8">
            <h2 className="text-sm font-medium text-fg">Repertoire</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ERAS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => requestConfig(id, target)}
                  className={cn(
                    "h-10 rounded-full px-3.5 text-sm transition-colors",
                    era === id
                      ? "bg-primary text-primary-fg"
                      : "bg-raised text-fg shadow-border hover:bg-surface",
                  )}
                >
                  {ERA_LABELS[id]}
                </button>
              ))}
            </div>
          </section>
          <Button
            size="lg"
            className="mt-8 w-full"
            disabled={!canStart}
            onClick={() => void requestStartOnline()}
          >
            {pending
              ? "Platten werden aufgelegt…"
              : readyCount < 2
                ? "Warte auf Mitspieler"
                : "Abend starten"}
          </Button>
        </>
      ) : (
        <p className="mt-8 rounded-md bg-raised px-4 py-3 text-sm text-muted shadow-border">
          Repertoire: {ERA_LABELS[era]} · {target} Karten. Der Host startet, sobald alle da sind.
        </p>
      )}
    </main>
  );
}
