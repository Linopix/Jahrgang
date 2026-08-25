import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import {
  getMusicElement,
  isMuted,
  pausePreview,
  setMasterVolume,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { currentPlayer, useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function PlayScreen() {
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const current = useGame((s) => s.current);
  const selectedSlot = useGame((s) => s.selectedSlot);
  const decadeHint = useGame((s) => s.decadeHint);
  const target = useGame((s) => s.target);
  const mode = useGame((s) => s.mode);
  const deckLength = useGame((s) => s.deck.length);
  const selectSlot = useGame((s) => s.selectSlot);
  const confirmPlacement = useGame((s) => s.confirmPlacement);
  const useDecade = useGame((s) => s.useDecade);
  const useSkip = useGame((s) => s.useSkip);
  const replay = useGame((s) => s.replay);
  const openHome = useGame((s) => s.openHome);
  const setRulesOpen = useGame((s) => s.setRulesOpen);

  const player = currentPlayer({ players, currentPlayerIndex });
  const [playing, setPlaying] = useState(true);
  const [muted, setMutedState] = useState(isMuted);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = getMusicElement();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (!el.duration) return;
      setProgress(el.currentTime / el.duration);
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onPause);
    };
  }, [current?.id]);

  if (!player || !current) return null;

  return (
    <main className="mx-auto flex h-dvh w-full max-w-5xl flex-col overflow-hidden px-4 pb-[env(safe-area-inset-bottom)] pt-4 sm:px-6 sm:pt-6">
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={openHome}
          className="font-display text-lg tracking-tight text-fg"
        >
          Jahrgang
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-11 px-2 text-sm text-muted hover:text-fg"
            onClick={() => setRulesOpen(true)}
          >
            Regeln
          </button>
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
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </header>

      {mode === "party" ? (
        <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {players.map((row, i) => {
            const active = i === currentPlayerIndex;
            return (
              <li
                key={row.id}
                className={cn(
                  "flex min-w-28 shrink-0 flex-col rounded-md px-3 py-2",
                  active ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border",
                )}
              >
                <span className="truncate text-sm font-medium">{row.name}</span>
                <span className="text-xs tabular-nums opacity-70">
                  {row.timeline.length}/{target}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Karten <span className="tabular-nums text-fg">{player.timeline.length}/{target}</span>
          <span className="mx-2 text-subtle">·</span>
          Fehler <span className="tabular-nums text-fg">{player.misses}/3</span>
        </p>
      )}

      <section className="mt-3 flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Am Zug</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-fg sm:text-5xl">{player.name}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Höre den Hit und lege ihn auf deine Zeitlinie. Links ist früher, rechts ist später.
        </p>

        <div className="mt-4">
          <Vinyl spinning={playing} artworkUrl={current.artworkUrl} size="md" />
        </div>

        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="size-11"
            aria-label={playing ? "Pause" : "Abspielen"}
            onClick={() => {
              unlockAudio();
              if (playing) pausePreview();
              else replay();
            }}
          >
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
          </Button>
          <Button variant="secondary" size="icon" className="size-11" aria-label="Nochmal" onClick={replay}>
            <RotateCcw className="size-4" />
          </Button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.85}
            aria-label="Lautstärke"
            className="hidden h-11 w-24 accent-primary sm:block"
            onChange={(event) => setMasterVolume(Number(event.target.value))}
          />
        </div>

        {decadeHint ? (
          <p className="mt-3 rounded-full bg-raised px-3 py-1.5 text-sm text-fg shadow-border">
            Jahrzehnt: {decadeHint}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={player.tokens <= 0 || Boolean(decadeHint)}
            onClick={useDecade}
          >
            Jahrzehnt · {player.tokens}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={player.tokens <= 0 || deckLength === 0}
            onClick={useSkip}
          >
            Überspringen
          </Button>
        </div>
      </section>

      <section className="mt-3 shrink-0 rounded-t-xl bg-surface p-3 shadow-border sm:rounded-xl sm:p-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Zeitlinie von {player.name}
          </p>
          <p className="text-xs text-subtle">früh → spät</p>
        </div>
        <Timeline
          songs={player.timeline}
          selectedSlot={selectedSlot}
          onSelectSlot={selectSlot}
        />
        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={selectedSlot === null}
          onClick={confirmPlacement}
        >
          Hier ablegen
        </Button>
      </section>
    </main>
  );
}
