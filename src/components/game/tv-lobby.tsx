import { useState } from "react";
import { Check, ChevronLeft, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrCode } from "./qr-code";
import { Vinyl } from "./vinyl";
import { GameOptions, optionsPile } from "./game-options";
import { shareUrl } from "@/lib/game/room-code";
import {
  requestConfig,
  requestKick,
  requestLeave,
  requestSkipTvClaim,
  requestStartOnline,
  requestTvStep,
} from "@/lib/game/online-actions";
import { roomConfigFrom, useOnline } from "@/lib/game/online-store";
import { playerSeats, useIsAdmin } from "@/lib/tv/mode";
import { TV_MODE_NAME, TV_STAGE_NAME } from "@/lib/tv/names";
import { cn } from "@/lib/utils";

function useRoomLink(host = false) {
  const roomCode = useOnline((s) => s.roomCode);
  return { roomCode, link: shareUrl(roomCode, host ? { host: true } : undefined) };
}

function CopyRow({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"code" | "link" | "discord" | null>(null);

  async function copy(kind: "code" | "link" | "discord") {
    const value =
      kind === "code" ? code : kind === "link" ? link : `${TV_MODE_NAME} · Raum ${code}\n${link}`;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt("Kopieren:", value);
    }
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <Button variant="secondary" className="flex-1" onClick={() => void copy("code")}>
        {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied === "code" ? "Code kopiert" : "Code kopieren"}
      </Button>
      <Button className="flex-1" onClick={() => void copy("link")}>
        {copied === "link" ? <Check className="size-4" /> : <Link2 className="size-4" />}
        {copied === "link" ? "Link kopiert" : "Link kopieren"}
      </Button>
      <Button variant="secondary" className="flex-1" onClick={() => void copy("discord")}>
        {copied === "discord" ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied === "discord" ? "Discord kopiert" : "Für Discord"}
      </Button>
    </div>
  );
}

export function TvLobbyScreen() {
  const tvStep = useOnline((s) => s.tvStep);
  const isAdmin = useIsAdmin();
  const role = useOnline((s) => s.role);
  const connecting = useOnline((s) => s.status) === "connecting";

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 lg:px-10">
      <button
        type="button"
        onClick={() => requestLeave()}
        className="back-link"
      >
        <ChevronLeft className="size-4" />
        Wohnzimmer schließen
      </button>
      {tvStep === "claim" && role === "host" ? <ClaimStep connecting={connecting} /> : null}
      {tvStep === "claim" && role !== "host" ? (
        <div className="mt-16 text-center">
          <Vinyl size="md" spinning />
          <h1 className="mt-8 font-display text-4xl text-fg">{TV_MODE_NAME}</h1>
          <p className="mt-3 text-muted">Die Bühne wird eingerichtet.</p>
        </div>
      ) : null}
      {tvStep === "setup" ? <SetupStep isAdmin={isAdmin} isTv={role === "host"} /> : null}
      {tvStep === "invite" ? <InviteStep isAdmin={isAdmin} isTv={role === "host"} /> : null}
    </main>
  );
}

function ClaimStep({ connecting }: { connecting: boolean }) {
  const { roomCode, link } = useRoomLink(true);

  return (
    <div className="mt-6 grid flex-1 items-center gap-10 lg:grid-cols-[minmax(16rem,28rem)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-sm">
        <QrCode value={link} label="Host-QR" className="aspect-square w-full shadow-lift" />
      </div>
      <div>
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Bühne</p>
        <h1 className="mt-2 font-display text-5xl font-medium text-fg">{TV_MODE_NAME}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Zuerst das Host-Handy. QR scannen, Namen eintragen — du stellst Pack und Start vom Handy.
          Dieser Bildschirm spielt nur.
        </p>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Discord: Bildschirm teilen, den Host-Link in den Chat. Danach kommt der Gäste-QR für alle
          im Call.
        </p>
        <p className="mt-6 font-mono text-5xl tracking-[0.28em] text-fg">{roomCode || "····"}</p>
        <CopyRow code={roomCode} link={link} />
        <Button
          size="lg"
          variant="secondary"
          className="mt-8 w-full max-w-md"
          disabled={connecting}
          onClick={() => requestSkipTvClaim()}
        >
          Überspringen — {TV_STAGE_NAME} bleibt Host
        </Button>
        <p className="mt-3 max-w-md text-xs text-subtle">
          Ohne Handy hat nur dieser Bildschirm die Rechte. Gut, wenn du allein am Fernseher oder am
          Stream-Rechner sitzt.
        </p>
      </div>
    </div>
  );
}

function SetupStep({ isAdmin, isTv }: { isAdmin: boolean; isTv: boolean }) {
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
  const members = useOnline((s) => s.members);
  const hostId = useOnline((s) => s.hostId);
  const adminId = useOnline((s) => s.adminId);
  const seats = playerSeats(members, hostId, tv);
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
    pool,
    emoji,
    chat,
    tv,
  });
  const pile = optionsPile(config, Math.max(seats.length, 1));
  const pileBlocked = pile.status === "short" || pile.status === "empty";
  const hostName = members.find((m) => m.id === adminId && m.id !== hostId)?.name;

  if (isTv && !isAdmin) {
    return (
      <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
        <Vinyl size="md" spinning />
        <p className="mt-8 text-xs tracking-[0.24em] text-muted uppercase">{TV_MODE_NAME}</p>
        <h1 className="mt-2 font-display text-5xl text-fg">Host stellt ein</h1>
        <p className="mt-4 max-w-lg text-lg text-muted">
          {hostName ? `${hostName} wählt Pack und Regeln am Handy.` : "Warten auf das Host-Handy."}{" "}
          Danach kommt der Gäste-QR auf diesen Bildschirm.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mt-10 max-w-lg">
        <p className="text-xs tracking-[0.24em] text-muted uppercase">{TV_MODE_NAME}</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Gleich geht’s los</h1>
        <p className="mt-3 text-sm text-muted">Der Host stellt Pack und Regeln ein.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-12">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted uppercase">{TV_MODE_NAME}</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Abend einstellen</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Pack, Stil, Karten. Danach der Gäste-QR — fürs Wohnzimmer und fürs Discord-Streaming.
        </p>
        <GameOptions value={config} onChange={requestConfig} online players={Math.max(seats.length, 1)} />
      </div>
      <div className="mt-8 lg:mt-16">
        <Button
          size="lg"
          className="w-full"
          disabled={pileBlocked}
          onClick={() => requestTvStep("invite")}
        >
          {pileBlocked ? "Zu wenig Titel" : "Gäste einladen"}
        </Button>
        <p className="mt-3 text-xs text-subtle">
          QR und Code kommen groß auf den Fernseher. Im Stream reicht der Code im Chat.
        </p>
      </div>
    </div>
  );
}

function InviteStep({ isAdmin, isTv }: { isAdmin: boolean; isTv: boolean }) {
  const { roomCode, link } = useRoomLink(false);
  const members = useOnline((s) => s.members);
  const hostId = useOnline((s) => s.hostId);
  const adminId = useOnline((s) => s.adminId);
  const pending = useOnline((s) => s.pending);
  const error = useOnline((s) => s.error);
  const tv = useOnline((s) => s.tv);
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
  const seats = playerSeats(members, hostId, tv);
  const need = 1;
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
    pool,
    emoji,
    chat,
    tv,
  });
  const pile = optionsPile(config, Math.max(seats.length, need));
  const pileBlocked = pile.status === "short" || pile.status === "empty";
  const canStart = isAdmin && !pending && seats.length >= need && !pileBlocked;

  return (
    <div className={cn("mt-6 grid flex-1 gap-10", isTv && "lg:grid-cols-[minmax(16rem,28rem)_minmax(0,1fr)]")}>
      <div className="mx-auto w-full max-w-sm">
        <QrCode value={link} label="Gäste-QR" className="aspect-square w-full shadow-lift" />
        <p className="mt-4 text-center font-mono text-5xl tracking-[0.28em] text-fg">
          {roomCode || "····"}
        </p>
        <CopyRow code={roomCode} link={link} />
      </div>
      <div>
        <p className="text-xs tracking-[0.24em] text-muted uppercase">{TV_MODE_NAME}</p>
        <h1 className="mt-2 font-display text-4xl text-fg">Mitspielen</h1>
        <p className="mt-3 max-w-xl text-base text-muted">
          Handy auf den QR. Im Discord-Stream den Code abtippen oder den Link aus dem Chat öffnen.
          Der Ton kommt von diesem Bildschirm.
        </p>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-fg">Im Raum</h2>
            <p className="text-xs tabular-nums text-subtle">{seats.length}/8</p>
          </div>
          <ul className="mt-3 space-y-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-md bg-raised px-4 py-3 text-sm shadow-border"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-fg">
                  {member.name}
                  {member.id === hostId ? (
                    <span className="ml-2 text-xs font-normal text-muted">{TV_STAGE_NAME}</span>
                  ) : member.id === adminId ? (
                    <span className="ml-2 text-xs font-normal text-muted">Host</span>
                  ) : member.connectionState === "self" ? (
                    <span className="ml-2 text-xs font-normal text-muted">du</span>
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
                    ? "Bühne"
                    : member.connectionState === "failed"
                      ? "blockiert"
                      : member.connectionState === "connecting"
                        ? "verbindet…"
                        : "verbunden"}
                </span>
                {isAdmin && member.id !== hostId && member.id !== adminId ? (
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
        {isAdmin ? (
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              disabled={!canStart}
              onClick={() => {
                void requestStartOnline();
              }}
            >
              {pending
                ? "Titel werden geladen…"
                : seats.length < need
                  ? "Mindestens ein Handy"
                  : pileBlocked
                    ? "Zu wenig Titel"
                    : "Abend starten"}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => requestTvStep("setup")}>
              Einstellungen
            </Button>
          </div>
        ) : (
          <p className="mt-8 rounded-md bg-raised px-4 py-3 text-sm text-muted shadow-border">
            Warten auf den Host. Du rätst auf dem Handy, sobald es losgeht.
          </p>
        )}
      </div>
    </div>
  );
}
