import { useEffect, useState } from "react";
import { Check, ChevronLeft, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameOptions, optionsPile, roomConfigSummary } from "./game-options";
import { shareUrl } from "@/lib/game/room-code";
import { requestConfig, requestKick, requestLeave, requestPassAdmin, requestStartOnline } from "@/lib/game/online-actions";
import { roomConfigFrom, useOnline } from "@/lib/game/online-store";
import { playerSeats, useIsAdmin } from "@/lib/tv/mode";
import { TV_LIVE } from "@/lib/tv/flags";
import { TV_MODE_NAME } from "@/lib/tv/names";
import { CUP_MIN, CUP_MAX, TOURNAMENT_LIVE } from "@/lib/tournament";
import { TournamentBoard } from "./tournament-board";
import { TvLobbyScreen } from "./tv-lobby";
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
  const error = useOnline((s) => s.error);
  const hostId = useOnline((s) => s.hostId);
  const adminId = useOnline((s) => s.adminId);
  const stagePlays = useOnline((s) => s.stagePlays);
  const pending = useOnline((s) => s.pending);
  const isHost = role === "host";
  const isAdmin = useIsAdmin();
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
    custom,
    extraEra,
    eras,
    pool,
    emoji,
    chat,
    tv,
    suggest,
    stageAudio,
    cup,
    cupSize,
    cupQualify,
    cupFlow,
    cupAudio,
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
  const seats = playerSeats(members, hostId, tv, stagePlays, cup);
  const currentAdmin = adminId || hostId;
  const need = cup && TOURNAMENT_LIVE ? CUP_MIN : TV_LIVE && tv ? 1 : 2;
  const pile = optionsPile(config, Math.max(seats.length, need));
  const pileBlocked = pile.status === "short" || pile.status === "empty";
  const canStart = isAdmin && !connecting && !pending && seats.length >= need && !pileBlocked;

  if (TV_LIVE && tv) return <TvLobbyScreen />;

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-28 pt-6 lg:max-w-6xl lg:px-8 lg:pb-8">
      <button
        type="button"
        onClick={() => requestLeave()}
        className="back-link"
      >
        <ChevronLeft className="size-4" />
        Raum verlassen
      </button>

      <p className="mt-4 kicker">
        {isHost ? (tv ? TV_MODE_NAME : "Du hostest") : "Du bist dabei"}
      </p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">{tv ? TV_MODE_NAME : "Lobby"}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {connecting
          ? isHost
            ? "Raum wird geöffnet…"
            : `Verbinde mit ${roomCode}…`
          : tv
            ? "Code auf das Steuergerät. Dieser Bildschirm zeigt die Runde, die anderen Geräte legen und raten."
            : "Code oder Link teilen. Der Host startet, sobald alle verbunden sind."}
      </p>

      <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <div>
      <section className="mt-6 rounded-xl bg-surface px-4 py-5 text-center shadow-border lg:mt-0 sm:px-5 sm:py-6">
        <p className="kicker">Raumcode</p>
        <p className="mt-3 font-mono text-4xl tracking-[0.28em] text-fg sm:text-5xl">{roomCode || "····"}</p>
        {roomCode ? (
          <img
            src={`/api/og?room=${encodeURIComponent(roomCode)}`}
            alt={`Einladung Raum ${roomCode}`}
            width={1200}
            height={630}
            className="mt-4 hidden w-full rounded-lg shadow-border sm:block sm:max-h-40 sm:object-cover"
          />
        ) : null}
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
        <Button
          variant="secondary"
          className="mt-2 w-full"
          onClick={async () => {
            const text = `Jahrgang · Raum ${roomCode}\n${link}`;
            try {
              await navigator.clipboard.writeText(text);
              setCopied("link");
              window.setTimeout(() => setCopied(null), 1600);
            } catch {
              // ignore
            }
          }}
        >
          Für Discord kopieren
        </Button>
      </section>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">Im Raum</h2>
          <p className="text-xs tabular-nums text-subtle">{readyCount}/{cup && TOURNAMENT_LIVE ? CUP_MAX : 8}</p>
        </div>
        <ul className="mt-3 space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-md bg-raised px-4 py-3 text-sm shadow-border"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-fg">
                {member.name}
                {member.connectionState === "self" ? (
                  <span className="ml-2 text-xs font-normal text-muted">
                    {tv && member.id === hostId ? "Bühne" : "du"}
                  </span>
                ) : member.id === hostId && tv ? (
                  <span className="ml-2 text-xs font-normal text-muted">Bühne</span>
                ) : member.id === currentAdmin ? (
                  <span className="ml-2 text-xs font-normal text-muted">Host</span>
                ) : null}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs",
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
              {isAdmin &&
              !(TOURNAMENT_LIVE && cup) &&
              member.id !== currentAdmin &&
              member.connectionState !== "failed" &&
              member.connectionState !== "disconnected" ? (
                <button
                  type="button"
                  aria-label={`${member.name} wird Host`}
                  onClick={() => requestPassAdmin(member.id)}
                  className="shrink-0 text-xs text-muted transition-colors duration-150 ease-out hover:text-fg"
                >
                  Übergeben
                </button>
              ) : null}
              {isAdmin && member.id !== hostId && member.id !== currentAdmin ? (
                <button
                  type="button"
                  aria-label={`${member.name} rauswerfen`}
                  onClick={() => requestKick(member.id)}
                  className="shrink-0 text-xs text-muted transition-colors duration-150 ease-out hover:text-danger"
                >
                  Raus
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      </div>

      {isAdmin ? (
        <div>
          {TOURNAMENT_LIVE && cup && tournament && tournament.status !== "idle" ? (
            <div className="mb-6 min-w-0 rounded-xl bg-surface p-4 shadow-border">
              <TournamentBoard t={tournament} compact />
            </div>
          ) : null}
          <GameOptions value={config} onChange={requestConfig} online players={Math.max(seats.length, need)} />
          <div className="fixed inset-x-0 bottom-0 z-20 bg-bg/90 px-16 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:inset-auto lg:bg-transparent lg:px-0 lg:pt-8 lg:pb-0 lg:backdrop-blur-none">
            <Button
              size="lg"
              className="w-full lg:max-w-xs"
              disabled={!canStart}
              onClick={() => {
                void requestStartOnline();
              }}
            >
              {pending
                ? "Titel werden geladen…"
                : seats.length < need
                  ? cup && TOURNAMENT_LIVE
                    ? `Mindestens ${CUP_MIN} Personen`
                    : tv
                    ? "Mindestens ein Handy"
                    : "Mindestens zwei Personen"
                  : pileBlocked
                    ? "Zu wenig Titel"
                    : cup && TOURNAMENT_LIVE
                      ? "Turnier starten"
                      : "Abend starten"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          {TOURNAMENT_LIVE && cup && tournament && tournament.status !== "idle" ? (
            <div className="mb-4 min-w-0 rounded-xl bg-surface p-4 shadow-border">
              <TournamentBoard t={tournament} compact />
            </div>
          ) : null}
          <p className="rounded-md bg-raised px-4 py-3 text-sm text-muted shadow-border">
            {roomConfigSummary(config)}. Der Host startet die Runde.
          </p>
        </div>
      )}
      </div>
    </main>
  );
}
