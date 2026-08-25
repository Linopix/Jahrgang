import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { SongCard } from "./song-card";
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
} from "@/lib/game/online-actions";
import { currentPlayer, useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { rankPlayers } from "@/lib/game/engine";
import { guessKind, rulesFor, VARIANT_LABELS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function MuteToggle() {
  const [muted, setMutedState] = useState(isMuted);
  return (
    <button
      type="button"
      aria-label={muted ? "Ton an" : "Stummschalten"}
      className="flex size-11 items-center justify-center rounded-md text-muted hover:text-fg"
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
    <main className="screen-in mx-auto flex h-dvh w-full max-w-[90rem] flex-col overflow-hidden px-8 py-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted uppercase">{VARIANT_LABELS[variant]}</p>
          <h1 className="font-display text-3xl text-fg">Jahrgang</h1>
        </div>
        <p className="font-mono text-3xl tracking-[0.2em] text-fg">{roomCode}</p>
        <div className="flex items-center gap-2">
          <MuteToggle />
          {canEndGame() ? (
            <button type="button" className="h-11 px-3 text-sm text-muted hover:text-fg" onClick={requestEnd}>
              Beenden
            </button>
          ) : (
            <button type="button" className="h-11 px-3 text-sm text-muted hover:text-fg" onClick={() => requestLeave()}>
              Schließen
            </button>
          )}
        </div>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 items-center gap-12">
        <div className="flex flex-1 flex-col items-center text-center">
          <p className="text-sm tracking-[0.2em] text-muted uppercase">Am Zug</p>
          <h2 className="mt-2 font-display text-6xl font-medium text-fg">{player.name}</h2>
          <p className="mt-3 text-lg text-muted">Handys raten. Der Ton kommt vom Fernseher.</p>
          <div className="mt-8">
            <Vinyl
              spinning={playing}
              reverse={rules.reverse}
              artworkUrl={rules.hideCover ? undefined : current.artworkUrl}
              size="lg"
            />
          </div>
        </div>
        <ol className="grid min-w-[22rem] max-w-md flex-1 gap-3">
          {players.map((row, i) => (
            <li
              key={row.id}
              className={cn(
                "rounded-xl px-4 py-3",
                i === currentPlayerIndex ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border",
              )}
            >
              <p className="truncate text-lg font-medium">{row.name}</p>
              <p className="text-sm tabular-nums opacity-80">
                {rules.open ? row.timeline.length : `${row.timeline.length}/${target}`}
              </p>
            </li>
          ))}
        </ol>
      </div>
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
          "text-sm tracking-[0.24em] uppercase",
          lastResult.correct ? "text-success" : "text-danger",
        )}
      >
        {lastResult.correct ? "Sitzt" : "Daneben"}
      </p>
      <h1 className="mt-3 font-display text-6xl font-medium text-fg">
        {lastResult.song.title}
      </h1>
      <p className="mt-3 text-2xl text-muted">{lastResult.song.artist}</p>
      <div className="mt-10">
        <SongCard song={lastResult.song} />
      </div>
      {kind !== "none" ? (
        <p className="mt-6 text-lg text-muted">
          {[lastResult.titleCorrect && "Titel", lastResult.artistCorrect && "Interpret"]
            .filter(Boolean)
            .join(" · ") || "Nichts getroffen"}
        </p>
      ) : null}
      <Button size="lg" className="mt-10 min-w-64" disabled={pending} onClick={requestNext}>
        {next ? `Weiter · ${next.name}` : "Weiter"}
      </Button>
    </main>
  );
}

export function TvWinnerScreen() {
  const players = useGame((s) => s.players);
  const ranked = rankPlayers(players);
  const top = ranked.slice(0, 3);

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-[70rem] flex-col items-center justify-center px-8 py-10 text-center">
      <p className="text-sm tracking-[0.24em] text-muted uppercase">Abend vorbei</p>
      <h1 className="mt-3 font-display text-6xl font-medium text-fg">Podest</h1>
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
            <p className="mt-1 font-display text-3xl text-fg">{row.name}</p>
            <p className="mt-2 tabular-nums text-muted">{row.timeline.length} Karten</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex gap-3">
        <Button size="lg" onClick={() => void requestAgain()}>
          Nochmal
        </Button>
        <Button size="lg" variant="secondary" onClick={requestBackToLobby}>
          Lobby
        </Button>
      </div>
    </main>
  );
}

export function TvListenBanner() {
  return (
    <p className="rounded-md bg-raised px-3 py-2 text-center text-xs text-muted">
      Ton kommt vom Fernseher. Du spielst hier auf dem Handy.
    </p>
  );
}
