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
import { canControlTurn, canEndGame, isOnlinePlay, requestDecade, requestEnd, requestLeave, requestPlace, requestSelectSlot, requestSkip } from "@/lib/game/online-actions";
import { currentPlayer, useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { CATALOG } from "@/lib/game/catalog";
import { guessMatches, mergeNamePairs, titlesForArtist, uniqueArtists, type NamePair } from "@/lib/game/guess";
import { getExtraNames, searchNameHints, subscribeNames } from "@/lib/game/names";
import { parseSuggest, rulesFor, VARIANT_LABELS } from "@/lib/game/types";
import { TvListenBanner } from "./tv-stage";
import { useTvRemote } from "@/lib/tv/mode";
import { cn } from "@/lib/utils";

function SwapIcon({
  on,
  OnIcon,
  OffIcon,
  onClassName,
  offClassName,
}: {
  on: boolean;
  OnIcon: typeof Pause;
  OffIcon: typeof Play;
  onClassName?: string;
  offClassName?: string;
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
          offClassName,
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
  const replay = useGame((s) => s.replay);
  const openHome = useGame((s) => s.openHome);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const pending = useOnline((s) => s.pending);
  const selfId = useOnline((s) => s.selfId);
  const hostLive = useOnline((s) => s.hostLive);
  const online = isOnlinePlay();
  const myTurn = canControlTurn();
  const tvRemote = useTvRemote();
  const rules = rulesFor(variant, custom);
  const deck = useGame((s) => s.deck);
  const original = rules.guess !== "none";
  const kind = rules.guess;
  const lastSetup = useGame((s) => s.lastSetup);
  const onlineSuggest = useOnline((s) => s.suggest);
  const suggestMode = kind === "both" ? parseSuggest(online ? onlineSuggest : lastSetup?.suggest) : "on";
  const [extra, setExtra] = useState(getExtraNames);
  const [playing, setPlaying] = useState(true);
  const [muted, setMutedState] = useState(isMuted);
  const [progress, setProgress] = useState(0);
  const [titleGuess, setTitleGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  useEffect(() => subscribeNames(() => setExtra(getExtraNames())), []);
  const remoteArtists = useRemoteHints(
    artistGuess,
    "artist",
    suggestMode !== "off" && (kind === "both" || kind === "artist"),
  );
  const remoteTitles = useRemoteHints(
    titleGuess,
    "title",
    suggestMode !== "off" && (kind === "both" || kind === "title"),
  );
  const remoteSongs = useRemoteHints(
    artistGuess,
    "songs",
    suggestMode === "on" && (kind === "both" || kind === "title") && artistGuess.trim().length >= 2,
  );
  const songs = useMemo(
    () =>
      mergeNamePairs([
        current ? [current] : [],
        deck,
        players.flatMap((row) => row.timeline),
        CATALOG,
        extra,
        remoteTitles,
        remoteSongs,
      ]),
    [deck, players, current, extra, remoteTitles, remoteSongs],
  );
  const artists = useMemo(
    () =>
      suggestMode === "off"
        ? []
        : uniqueArtists(
            songs,
            remoteArtists.map((row) => row.artist),
          ),
    [songs, remoteArtists, suggestMode],
  );

  const player = currentPlayer({ players, currentPlayerIndex });
  const titles = useMemo(() => {
    if (suggestMode === "off") return [];
    return titlesForArtist(suggestMode === "loose" ? "" : artistGuess, songs);
  }, [songs, artistGuess, suggestMode]);

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

  const guessed = Boolean(
    ((kind === "both" || kind === "title") && titleGuess.trim()) ||
      ((kind === "both" || kind === "artist") && artistGuess.trim()),
  );
  const bothHit =
    variant === "original" &&
    Boolean(titleGuess.trim()) &&
    Boolean(artistGuess.trim()) &&
    guessMatches(titleGuess, current.title, "title") &&
    guessMatches(artistGuess, current.artist, "artist");
  const showCover = !rules.hideCover || bothHit;

  const transport = (
    <div className="flex items-center gap-2">
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
        <SwapIcon on={playing} OnIcon={Pause} OffIcon={Play} offClassName="ml-px" />
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
        className="range-single hidden w-24 sm:block"
        onChange={(event) => setMasterVolume(Number(event.target.value))}
      />
    </div>
  );

  const jokers =
    variant === "original" || player.tokens > 0 || decadeHint ? (
      <div className="flex flex-wrap justify-center gap-2">
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
    ) : null;

  const guesses =
    kind !== "none" && myTurn ? (
      <form
        className={cn("mt-2 grid w-full gap-2 text-left", kind === "both" && "grid-cols-2")}
        onSubmit={(event) => event.preventDefault()}
      >
        {kind === "both" || kind === "title" ? (
          <GuessField
            label="Titel"
            placeholder={kind === "both" ? "Freiwillig" : "Titel"}
            value={titleGuess}
            onChange={setTitleGuess}
            pool={titles}
            showWhenEmpty={suggestMode === "on" && Boolean(artistGuess.trim())}
          />
        ) : null}
        {kind === "both" || kind === "artist" ? (
          <GuessField
            label="Interpret"
            placeholder={kind === "both" ? "Freiwillig" : "Interpret"}
            value={artistGuess}
            onChange={setArtistGuess}
            pool={artists}
          />
        ) : null}
      </form>
    ) : null;

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden px-4 pb-[env(safe-area-inset-bottom)] pt-3 sm:px-6 sm:pt-5 lg:max-w-7xl">
      <header className="theme-clear flex items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => (online ? requestLeave() : openHome())}
            className="font-display text-lg tracking-tight text-fg"
          >
            Jahrgang
          </button>
          <p className="truncate text-2xs tracking-[0.16em] text-subtle uppercase">
            {VARIANT_LABELS[variant]}
            <span className="mx-1.5">·</span>
            {deckLength} im Stapel
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="h-11 px-2 text-sm text-muted transition-colors duration-150 ease-out hover:text-fg"
            onClick={() => setRulesOpen(true)}
          >
            Regeln
          </button>
          {canEndGame() ? (
            <button
              type="button"
              className="h-11 px-2 text-sm text-muted transition-colors duration-150 ease-out hover:text-fg"
              onClick={requestEnd}
            >
              Beenden
            </button>
          ) : null}
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
            <SwapIcon on={muted} OnIcon={VolumeX} OffIcon={Volume2} />
          </button>
        </div>
      </header>

      {online && !hostLive ? (
        <p className="mt-2 rounded-md bg-raised px-3 py-2 text-center text-sm text-muted">
          Host verbindet neu. Kurz warten.
        </p>
      ) : null}

      {mode === "party" ? (
        <ol className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {players.map((row, i) => {
            const active = i === currentPlayerIndex;
            return (
              <li
                key={row.id}
                className={cn(
                  "flex min-w-24 shrink-0 flex-col rounded-md px-2.5 py-1.5 transition-[background-color,color] duration-200 ease-soft",
                  active ? "bg-primary text-primary-fg" : "bg-raised text-fg shadow-border",
                )}
              >
                <span className="truncate text-sm font-medium">
                  {row.name}
                  {online && row.id === selfId ? " · du" : ""}
                </span>
                <span className="text-2xs tabular-nums opacity-70">
                  {active ? "dran · " : ""}
                  {rules.open ? row.timeline.length : `${row.timeline.length}/${target}`}
                  {original ? ` · ${row.quiz}` : ""}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-muted">
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

      <div className="mt-2 flex min-h-0 flex-1 flex-col lg:mt-3 lg:grid lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:gap-8 lg:overflow-hidden">
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden text-center lg:justify-center lg:overflow-y-auto">
        <p className="kicker">
          {online && !myTurn ? "Du hörst mit" : original ? "Raten und legen" : "Am Zug"}
        </p>
        {tvRemote ? <div className="mt-2 w-full max-w-sm"><TvListenBanner /></div> : null}
        <h1 className="mt-1 font-display text-xl font-medium text-fg sm:text-5xl">{player.name}</h1>
        <p className="mt-2 hidden max-w-md text-sm text-muted sm:block">
          {online && !myTurn
            ? `${player.name} legt gerade. Du siehst die Linie.`
            : kind === "both"
              ? rules.reverse
                ? "Tipp ist freiwillig. Beides richtig: Cover und ein Joker. Links ist später."
                : rules.free
                  ? "Tipp ist freiwillig. Beides richtig: Cover und ein Joker."
                  : "Tipp ist freiwillig. Beides richtig: Cover und ein Joker, dann legen."
              : kind === "artist"
                ? "Interpret tippen wenn du ihn weißt, sonst einfach legen."
                : kind === "title"
                  ? "Titel tippen wenn du ihn weißt, sonst einfach legen."
                  : rules.reverse
                    ? "Hören und legen. Links ist später, die Jahre bleiben versteckt."
                    : rules.hideCover
                    ? "Hören und legen. Das Cover bleibt zu."
                    : rules.free
                    ? "Hören und irgendwo hinlegen."
                    : "Hören und auf die Linie legen. Links früher, rechts später."}
        </p>

        <div className="mt-3">
          <Vinyl
            spinning={playing}
            reverse={rules.reverse}
            artworkUrl={showCover ? current.artworkUrl : undefined}
            size="md"
          />
        </div>

        <div className="mt-3 h-1 w-40 overflow-hidden rounded-full bg-raised sm:w-48">
          <div
            className="h-full origin-left bg-primary transition-transform duration-200 ease-soft"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        {decadeHint ? (
          <p className="mt-3 rounded-full bg-raised px-3 py-1.5 text-sm text-fg shadow-border pop-in">
            Jahrzehnt: {decadeHint}
          </p>
        ) : null}

        <div className="mt-3 hidden lg:block">{transport}</div>
        <div className="mt-3 hidden lg:block">{jokers}</div>
        <div className="hidden w-full max-w-md lg:block">{guesses}</div>
      </section>

      <section className="mt-2 flex shrink-0 flex-col rounded-t-xl bg-surface p-3 shadow-border sm:rounded-xl sm:p-4 lg:mt-0 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="mb-2 flex flex-col items-center gap-2 lg:hidden">
          {transport}
          {jokers}
        </div>
        <div className="lg:hidden">{guesses}</div>
        <div className="mb-2 hidden items-center justify-between px-1 lg:flex">
          <p className="kicker">
            Zeitlinie von {player.name}
          </p>
          <p className="text-xs text-subtle">
            {rules.free ? "frei" : rules.reverse ? "spät → früh" : "früh → spät"}
          </p>
        </div>
        <div className="min-h-0 lg:flex-1 lg:overflow-y-auto">
        <Timeline
          songs={player.timeline}
          selectedSlot={selectedSlot}
          onSelectSlot={myTurn ? requestSelectSlot : undefined}
          interactive={myTurn}
          showSlots
          hideYear={rules.hideYear}
        />
        </div>
        <Button
          size="lg"
          className={cn("mt-2 w-full", online && "max-lg:mx-14 max-lg:w-auto")}
          disabled={!myTurn || pending}
          onClick={() => {
            if (!myTurn || pending) return;
            if (selectedSlot === null) {
              document.querySelector<HTMLElement>("[data-slot]")?.focus();
              return;
            }
            requestPlace({ title: titleGuess, artist: artistGuess });
          }}
        >
          {!myTurn
            ? `Warten auf ${player.name}`
            : selectedSlot === null
              ? "Platz auf der Linie wählen"
              : original && guessed
                ? "Tipp ablegen"
                : "Hier ablegen"}
        </Button>
      </section>
      </div>
    </main>
  );
}

function useRemoteHints(query: string, kind: "artist" | "title" | "songs", enabled: boolean) {
  const [rows, setRows] = useState<NamePair[]>([]);
  useEffect(() => {
    if (!enabled || query.trim().length < 2) {
      setRows([]);
      return;
    }
    let cancel = false;
    const timer = window.setTimeout(() => {
      void searchNameHints({ data: { q: query, kind } }).then((next) => {
        if (!cancel) setRows(next);
      });
    }, 350);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [query, kind, enabled]);
  return rows;
}
