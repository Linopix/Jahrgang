import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameOptions, roomConfigSummary } from "./game-options";
import { shareUrl } from "@/lib/game/room-code";
import { requestConfig, requestLeave, requestStartOnline } from "@/lib/game/online-actions";
import { roomConfigFrom, useOnline } from "@/lib/game/online-store";
import { cn } from "@/lib/utils";

export function OnlineLobbyScreen() {
  const role = useOnline((s) => s.role);
  const status = useOnline((s) => s.status);
  const roomCode = useOnline((s) => s.roomCode);
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
  const error = useOnline((s) => s.error);
  const hostId = useOnline((s) => s.hostId);
  const pending = useOnline((s) => s.pending);
  const isHost = role === "host";
  const connecting = status === "connecting";
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const link = shareUrl(roomCode);
  const config = roomConfigFrom({
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
  });

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
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 lg:max-w-6xl lg:px-8">
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
      <p className="mt-2 max-w-xl text-sm text-muted">
        {connecting
          ? isHost
            ? "Raum wird geöffnet…"
            : `Verbinde mit ${roomCode}…`
          : "Code oder Link teilen. Der Host startet, sobald alle verbunden sind."}
      </p>

      <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div>
      <section className="mt-8 rounded-xl bg-surface px-5 py-6 text-center shadow-border lg:mt-0">
        <p className="text-xs tracking-[0.22em] text-muted uppercase">Raumcode</p>
        <p className="mt-3 font-mono text-5xl tracking-[0.28em] text-fg">{roomCode || "····"}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={() => void copy("code")}>
            {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === "code" ? "Code kopiert" : "Code kopieren"}
          </Button>
          <Button className="flex-1" onClick={() => void copy("link")}>
            {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
            {copied === "link" ? "Link kopiert" : "Link kopieren"}
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
      </div>

      {isHost ? (
        <div>
          <GameOptions value={config} onChange={requestConfig} online />
          <Button
            size="lg"
            className="mt-8 w-full lg:max-w-xs"
            disabled={!canStart}
            onClick={() => void requestStartOnline()}
          >
            {pending
              ? "Titel werden geladen…"
              : readyCount < 2
                ? "Mindestens zwei Personen"
                : "Abend starten"}
          </Button>
        </div>
      ) : (
        <p className="mt-8 rounded-md bg-raised px-4 py-3 text-sm text-muted shadow-border">
          {roomConfigSummary(config)}. Der Host startet die Runde.
        </p>
      )}
      </div>
    </main>
  );
}
