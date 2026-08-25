import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import { GuessField } from "./guess-field";
import {
  getMusicElement,
  isMuted,
  pausePreview,
  setMasterVolume,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { canControlTurn, canEndGame, isOnlinePlay, requestDecade, requestEnd, requestLeave, requestPlace, requestSkip } from "@/lib/game/online-actions";
import { currentPlayer, useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { catalogArtists, catalogTitles } from "@/lib/game/catalog";
import { rulesFor, VARIANT_LABELS } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function SwapIcon({
  on,
  OnIcon,
  OffIcon,
  onClassName,
}: {
  on: boolean;
  OnIcon: typeof Pause;
  OffIcon: typeof Play;
  onClassName?: string;
}) {
  return (
    <span className="relative inline-flex size-4">
      <OnIcon
        className={cn(
          "icon-swap absolute inset-0 size-4",
          onClassName,
          on ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
        )}
      />
      <OffIcon
        className={cn(
          "icon-swap size-4",
          on ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
        )}
      />
    </span>
  );
}

export function PlayScreen() {
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const current = useGame((s) => s.current);
  const selectedSlot = useGame((s) => s.selectedSlot);
  const decadeHint = useGame((s) => s.decadeHint);
  const target = useGame((s) => s.target);
  const mode = useGame((s) => s.mode);
  const variant = useGame((s) => s.variant);
  const custom = useGame((s) => s.custom);
  const deckLength = useGame((s) => s.deck.length);
  const selectSlot = useGame((s) => s.selectSlot);
  const replay = useGame((s) => s.replay);
  const openHome = useGame((s) => s.openHome);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const pending = useOnline((s) => s.pending);
  const selfId = useOnline((s) => s.selfId);
  const online = isOnlinePlay();
  const myTurn = canControlTurn();
  const rules = rulesFor(variant, custom);
  const original = rules.guess !== "none";
  const kind = rules.guess;
  const titles = useMemo(() => {
    const extra = [
      ...players.flatMap((row) => row.timeline.map((song) => song.title)),
      ...(current ? [current.title] : []),
    ];
    return [...new Set([...catalogTitles(), ...extra])];
  }, [players, current]);
  const artists = useMemo(() => {
    const extra = [
      ...players.flatMap((row) => row.timeline.map((song) => song.artist)),
      ...(current ? [current.artist] : []),
    ];
    return [...new Set([...catalogArtists(), ...extra])];
  }, [players, current]);

  const player = currentPlayer({ players, currentPlayerIndex });
  const [playing, setPlaying] = useState(true);
  const [muted, setMutedState] = useState(isMuted);
  const [progress, setProgress] = useState(0);
  const [titleGuess, setTitleGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");

  useEffect(() => {
    setTitleGuess("");
    setArtistGuess("");
  }, [current?.id]);

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

  const guessesReady = !original || (titleGuess.trim().length > 0 && artistGuess.trim().length > 0);
  const canPlaceCard = myTurn && selectedSlot !== null && !pending && guessesReady;

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden px-4 pb-[env(safe-area-inset-bottom)] pt-4 sm:px-6 sm:pt-6 lg:max-w-7xl">
      <header className="flex items-center justify-between gap-3 pr-14">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => (online ? requestLeave() : openHome())}
            className="font-display text-lg tracking-tight text-fg"
          >
            Jahrgang
          </button>
          <p className="truncate text-[0.65rem] tracking-[0.16em] text-subtle uppercase">
            {VARIANT_LABELS[variant]}
            <span className="mx-1.5">·</span>
            {deckLength} im Stapel
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="h-11 px-2 text-sm text-muted hover:text-fg"
            onClick={() => setRulesOpen(true)}
          >
            Regeln
          </button>
          {canEndGame() ? (
            <button
              type="button"
              className="h-11 px-2 text-sm text-muted hover:text-fg"
              onClick={requestEnd}
            >
              Beenden
            </button>
          ) : null}
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
            <SwapIcon on={muted} OnIcon={VolumeX} OffIcon={Volume2} />
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
                  "flex min-w-28 shrink-0 flex-col rounded-md px-3 py-2 transition-[background-color,color,transform] duration-200 ease-out hover:-translate-y-px",
                  active ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border",
                )}
              >
                <span className="truncate text-sm font-medium">
                  {row.name}
                  {online && row.id === selfId ? " · du" : ""}
                </span>
                <span className="text-xs tabular-nums opacity-70">
                  {rules.open ? row.timeline.length : `${row.timeline.length}/${target}`}
                  {original ? ` · ${row.quiz}` : ""}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Karten{" "}
          <span className="tabular-nums text-fg">
            {rules.open ? player.timeline.length : `${player.timeline.length}/${target}`}
          </span>
          {rules.open ? null : (
            <>
              <span className="mx-2 text-subtle">·</span>
              Fehler <span className="tabular-nums text-fg">{player.misses}/3</span>
            </>
          )}
          {original ? (
            <>
              <span className="mx-2 text-subtle">·</span>
              Treffer <span className="tabular-nums text-fg">{player.quiz}</span>
            </>
          ) : null}
        </p>
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:gap-8 lg:overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto text-center lg:justify-center">
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
          {online && !myTurn ? "Du hörst mit" : original ? "Raten und legen" : "Am Zug"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-fg sm:text-5xl">{player.name}</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          {online && !myTurn
            ? `${player.name} ist am Zug.`
            : kind === "both"
              ? rules.reverse
                ? "Raten. Links später."
                : rules.free
                  ? "Raten, dann irgendwo hin."
                  : "Raten, dann legen."
              : kind === "artist"
                ? "Interpret, dann legen."
                : kind === "title"
                  ? "Titel, dann legen."
                  : rules.reverse
                    ? "Legen. Links später."
                    : rules.hideCover
                    ? "Legen. Cover zu."
                    : rules.free
                    ? "Irgendwo hinlegen."
                    : "Hören und legen."}
        </p>

        <div className="mt-4">
          <Vinyl
            spinning={playing}
            reverse={rules.reverse}
            artworkUrl={rules.hideCover ? undefined : current.artworkUrl}
            size="md"
          />
        </div>

        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full origin-left bg-primary"
            style={{ transform: `scaleX(${progress})` }}
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
            <SwapIcon on={playing} OnIcon={Pause} OffIcon={Play} onClassName="" />
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
          <p className="mt-3 rounded-full bg-raised px-3 py-1.5 text-sm text-fg shadow-border pop-in">
            Jahrzehnt: {decadeHint}
          </p>
        ) : null}

        {player.tokens > 0 || decadeHint ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!myTurn || player.tokens <= 0 || Boolean(decadeHint)}
              onClick={requestDecade}
            >
              Jahrzehnt · {player.tokens}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!myTurn || player.tokens <= 0 || deckLength === 0}
              onClick={requestSkip}
            >
              Überspringen
            </Button>
          </div>
        ) : null}

        {kind !== "none" && myTurn ? (
          <form
            className={cn(
              "mt-5 grid w-full max-w-md gap-2 text-left",
              kind === "both" && "sm:grid-cols-2",
            )}
            onSubmit={(event) => event.preventDefault()}
          >
            {kind === "both" || kind === "title" ? (
              <GuessField
                label="Titel"
                placeholder="Titel"
                value={titleGuess}
                onChange={setTitleGuess}
                pool={titles}
              />
            ) : null}
            {kind === "both" || kind === "artist" ? (
              <GuessField
                label="Interpret"
                placeholder="Interpret"
                value={artistGuess}
                onChange={setArtistGuess}
                pool={artists}
              />
            ) : null}
          </form>
        ) : null}
      </section>

      <section className="mt-3 shrink-0 rounded-t-xl bg-surface p-3 shadow-border sm:rounded-xl sm:p-4 lg:mt-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Zeitlinie von {player.name}
          </p>
          <p className="text-xs text-subtle">
            {rules.free ? "frei" : rules.reverse ? "spät → früh" : "früh → spät"}
          </p>
        </div>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-x-auto lg:overflow-y-auto">
        <Timeline
          songs={player.timeline}
          selectedSlot={myTurn ? selectedSlot : null}
          onSelectSlot={myTurn ? selectSlot : undefined}
          interactive={myTurn}
          hideYear={rules.hideYear}
        />
        </div>
        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={!canPlaceCard}
          onClick={() => requestPlace({ title: titleGuess, artist: artistGuess })}
        >
          {myTurn ? (original ? "Tipp ablegen" : "Hier ablegen") : `Warten auf ${player.name}`}
        </Button>
      </section>
      </div>
    </main>
  );
}
