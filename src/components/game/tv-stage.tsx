import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { SongCard } from "./song-card";
import { Timeline } from "./timeline";
import {
  getMusicElement,
  isMuted,
  setMuted,
} from "@/lib/game/audio";
import {
  canEndGame,
  requestEnd,
  requestLeave,
  requestNext,
  requestAgain,
  requestBackToLobby,
  requestEndEvening,
  requestFinishCupMatch,
} from "@/lib/game/online-actions";
import { currentPlayer, useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { rankPlayers } from "@/lib/game/engine";
import { guessKind, rulesFor, VARIANT_LABELS } from "@/lib/game/types";
import { enterBigscreen } from "@/lib/tv/fullscreen";
import { useIsAdmin } from "@/lib/tv/mode";
import { cn } from "@/lib/utils";
import { TournamentBoard } from "./tournament-board";
import { TOURNAMENT_LIVE, currentMatch, liveMatches } from "@/lib/tournament";

function MuteToggle() {
  const [muted, setMutedState] = useState(isMuted);
  return (
    <button
      type="button"
      aria-label={muted ? "Ton an" : "Stummschalten"}
      className="flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:text-fg"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
      }}
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
}

export function TvPlayScreen() {
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const current = useGame((s) => s.current);
  const selectedSlot = useGame((s) => s.selectedSlot);
  const variant = useGame((s) => s.variant);
  const custom = useGame((s) => s.custom);
  const target = useGame((s) => s.target);
  const roomCode = useOnline((s) => s.roomCode);
  const player = currentPlayer({ players, currentPlayerIndex });
  const rules = rulesFor(variant, custom);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const el = getMusicElement();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, [current?.id]);

  if (!player || !current) return null;

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-[90rem] flex-col overflow-hidden px-8 py-6 lg:px-12">
      <header className="theme-clear flex items-center justify-between gap-4">
        <div>
          <p className="tv-kicker">{VARIANT_LABELS[variant]}</p>
          <h1 className="font-display text-3xl text-fg lg:text-4xl">Jahrgang</h1>
        </div>
        <p className="font-mono text-3xl tracking-[0.2em] text-fg lg:text-5xl">{roomCode}</p>
        <div className="flex items-center gap-2">
          <MuteToggle />
          {canEndGame() ? (
            <button type="button" className="h-11 px-3 text-sm text-muted transition-colors duration-150 ease-out hover:text-fg" onClick={requestEnd}>
              Beenden
            </button>
          ) : (
            <button type="button" className="h-11 px-3 text-sm text-muted transition-colors duration-150 ease-out hover:text-fg" onClick={() => requestLeave()}>
              Schließen
            </button>
          )}
        </div>
      </header>

      <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col items-center gap-8 lg:flex-row lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <p className="tv-kicker">Am Zug</p>
          <h2 className="mt-2 tv-name">{player.name}</h2>
          <p className="mt-3 text-lg text-muted lg:text-xl">Eingabe auf den anderen Geräten. Ton von diesem Bildschirm.</p>
          <div className="mt-6">
            <Vinyl
              spinning={playing}
              reverse={rules.reverse}
              artworkUrl={rules.hideCover ? undefined : current.artworkUrl}
              size="xl"
            />
          </div>
        </div>
        <ol className="grid min-w-0 w-full max-w-lg shrink-0 gap-3 sm:min-w-[18rem]">
          {players.map((row, i) => (
            <li
              key={row.id}
              className={cn(
                "rounded-xl px-5 py-4",
                i === currentPlayerIndex ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border",
              )}
            >
              <p className="truncate text-xl font-medium lg:text-2xl">{row.name}</p>
              <p className="mt-1 text-base tabular-nums opacity-80 lg:text-lg">
                {rules.open ? row.timeline.length : `${row.timeline.length}/${target}`}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <section className="mt-6 min-h-0 shrink-0">
        <p className="mb-2 tv-kicker">
          Linie von {player.name}
        </p>
        <Timeline
          songs={player.timeline}
          selectedSlot={selectedSlot}
          interactive={false}
          showSlots
          hideYear={rules.hideYear}
          tv
        />
      </section>
    </main>
  );
}

export function TvRevealScreen() {
  const lastResult = useGame((s) => s.lastResult);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const variant = useGame((s) => s.variant);
  const custom = useGame((s) => s.custom);
  const pending = useOnline((s) => s.pending);
  if (!lastResult) return null;
  const next = players[(currentPlayerIndex + 1) % players.length];
  const kind = guessKind(variant, custom);

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-[70rem] flex-col items-center justify-center px-8 py-10 text-center">
      <p
        className={cn(
          "tv-kicker",
          lastResult.correct ? "text-success" : "text-danger",
        )}
      >
        {lastResult.correct ? "Sitzt" : "Daneben"}
      </p>
      <h1 className="mt-3 tv-title">
        {lastResult.song.title}
      </h1>
      <p className="mt-3 text-2xl text-muted lg:text-3xl">{lastResult.song.artist}</p>
      <div className="mt-10">
        <SongCard song={lastResult.song} tv />
      </div>
      {kind !== "none" ? (
        <p className="mt-6 text-lg text-muted">
          {[lastResult.titleCorrect && "Titel", lastResult.artistCorrect && "Interpret"]
            .filter(Boolean)
            .join(" · ") || (lastResult.titleGuess?.trim() || lastResult.artistGuess?.trim() ? "Nichts getroffen" : "Ohne Tipp")}
          {lastResult.jokerEarned ? " · Joker" : ""}
        </p>
      ) : null}
      <Button size="xl" className="mt-10 min-w-64" disabled={pending} onClick={requestNext}>
        {next ? `Weiter · ${next.name}` : "Weiter"}
      </Button>
    </main>
  );
}

export function TvWinnerScreen() {
  const players = useGame((s) => s.players);
  const ranked = rankPlayers(players);
  const top = ranked.slice(0, 3);
  const admin = useIsAdmin();
  const tournament = useOnline((s) => s.tournament);
  const cupOn = TOURNAMENT_LIVE && Boolean(useOnline((s) => s.cup));
  const pending = useOnline((s) => s.pending);
  const cupMatch = cupOn ? currentMatch(tournament) : null;

  useEffect(() => {
    if (!cupOn || !admin) return;
    requestFinishCupMatch();
  }, [cupOn, admin, players]);

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-[70rem] flex-col items-center justify-center px-8 py-10 text-center">
      <p className="tv-kicker">{cupOn ? "Begegnung" : "Abend vorbei"}</p>
      <h1 className="mt-3 tv-title">{cupOn && tournament?.status === "done" ? "Turniersieger" : "Podest"}</h1>
      <ol className="mt-12 flex items-end justify-center gap-6">
        {top.map((row, i) => (
          <li
            key={row.id}
            className={cn(
              "rounded-xl bg-raised px-8 py-6 shadow-border",
              i === 0 && "min-w-56 pb-10",
              i === 1 && "min-w-44 order-first",
              i === 2 && "min-w-44",
            )}
          >
            <p className="text-sm text-muted">{i + 1}.</p>
            <p className="mt-1 font-display text-3xl text-fg lg:text-4xl">{row.name}</p>
            <p className="mt-2 tabular-nums text-muted">{row.timeline.length} Karten</p>
          </li>
        ))}
      </ol>
      {cupOn && tournament ? (
        <div className="mt-10 w-full min-w-0 text-left">
          <TournamentBoard t={tournament} tv />
        </div>
      ) : null}
      {admin ? (
        <div className="mt-12 flex gap-3">
          <Button
            size="xl"
            disabled={pending}
            onClick={() => {
              if (cupOn && tournament?.status === "done") {
                requestBackToLobby();
                return;
              }
              void requestAgain();
            }}
          >
            {cupOn
              ? tournament?.status === "done"
                ? "Lobby"
                : cupMatch?.stechen
                  ? "Stechen"
                  : "Weiter"
              : "Nochmal"}
          </Button>
          {!cupOn ? (
            <>
              <Button size="xl" variant="secondary" onClick={requestBackToLobby}>
                Lobby
              </Button>
              <Button size="xl" variant="ghost" onClick={requestEndEvening}>
                Abend
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <p className="mt-12 text-muted">Weiter vom Host-Handy.</p>
      )}
    </main>
  );
}

export function TvCupGridScreen() {
  const boards = useOnline((s) => s.cupBoards);
  const tournament = useOnline((s) => s.tournament);
  const roomCode = useOnline((s) => s.roomCode);
  const pending = useOnline((s) => s.pending);
  const admin = useIsAdmin();
  const live = liveMatches(tournament);
  const done = tournament?.status === "done";
  const waiting = live.length === 0 && !done;

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-[90rem] flex-col overflow-hidden px-6 py-5 lg:px-10">
      <header className="theme-clear flex items-center justify-between gap-4">
        <div>
          <p className="tv-kicker">Turnier</p>
          <h1 className="font-display text-3xl text-fg lg:text-4xl">
            {done ? "Turniersieger" : waiting ? "Nächste Runde" : "Laufende Begegnungen"}
          </h1>
        </div>
        <p className="font-mono text-3xl tracking-[0.2em] text-fg lg:text-5xl">{roomCode}</p>
        <MuteToggle />
      </header>
      <div className="cup-live-grid mt-6 min-h-0 flex-1 overflow-auto">
        {(boards.length ? boards : live.map((match) => ({
          matchId: match.id,
          title: match.round === "group" ? "Gruppe" : match.round,
          phase: "idle" as const,
          currentName: "",
          rows: match.playerIds.map((id) => ({ id, name: id, cards: 0, quiz: 0 })),
        }))).map((card) => (
          <article key={card.matchId} className={cn("cup-live-card", card.phase === "winner" && "is-done")}>
            <p className="cup-live-title">{card.title}</p>
            {card.currentName && card.phase !== "winner" ? (
              <p className="cup-live-now">Dran: {card.currentName}</p>
            ) : (
              <p className="cup-live-now">{card.phase === "winner" ? "fertig" : "läuft"}</p>
            )}
            <ol>
              {card.rows.map((row) => (
                <li key={row.id} className="cup-live-row">
                  <span className="min-w-0 truncate">{row.name}</span>
                  <span className="tabular-nums text-muted">
                    {row.cards} · {row.quiz}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {tournament ? (
        <div className="mt-4 min-w-0 shrink-0">
          <TournamentBoard t={tournament} tv compact />
        </div>
      ) : null}
      {admin && (waiting || done) ? (
        <div className="mt-4 flex gap-3">
          <Button
            size="lg"
            disabled={pending}
            onClick={() => {
              if (done) {
                requestBackToLobby();
                return;
              }
              void requestAgain();
            }}
          >
            {done ? "Lobby" : "Weiter"}
          </Button>
        </div>
      ) : null}
    </main>
  );
}

export function TvListenBanner() {
  return (
    <p className="rounded-md bg-raised px-3 py-2 text-center text-xs text-muted">
      Ton kommt von der Bühne. Eingabe auf diesem Gerät.
    </p>
  );
}

export function BigscreenPrompt() {
  const [need, setNeed] = useState(
    () => typeof document !== "undefined" && !document.fullscreenElement,
  );
  useEffect(() => {
    const sync = () => setNeed(!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!need) return null;
  return (
    <button
      type="button"
      className="fixed inset-x-0 bottom-0 z-40 bg-bg/90 px-5 py-4 text-center text-sm text-fg backdrop-blur-md"
      onClick={() => {
        enterBigscreen();
      }}
    >
      Tippen für Vollbild
    </button>
  );
}
