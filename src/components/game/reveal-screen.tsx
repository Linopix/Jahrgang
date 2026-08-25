import { Button } from "@/components/ui/button";
import { SongCard } from "./song-card";
import { canControlTurn, isOnlinePlay, requestNext } from "@/lib/game/online-actions";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { cn } from "@/lib/utils";

function Mark({ ok, label, guess, actual }: { ok: boolean; label: string; guess?: string; actual: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-2.5 text-left shadow-border">
      <p className="flex items-center justify-between gap-3 text-xs tracking-[0.16em] uppercase">
        <span className="text-muted">{label}</span>
        <span className={ok ? "text-success" : "text-danger"}>{ok ? "Treffer" : "Daneben"}</span>
      </p>
      <p className="mt-1 truncate text-sm text-fg">{actual}</p>
      {guess && guess.trim() && guess.trim().toLowerCase() !== actual.toLowerCase() ? (
        <p className="truncate text-xs text-muted">Tipp: {guess.trim()}</p>
      ) : null}
    </div>
  );
}

export function RevealScreen() {
  const lastResult = useGame((s) => s.lastResult);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const mode = useGame((s) => s.mode);
  const variant = useGame((s) => s.variant);
  const pending = useOnline((s) => s.pending);
  const online = isOnlinePlay();
  const myTurn = canControlTurn();
  const host = useOnline((s) => s.role) === "host";

  if (!lastResult) return null;
  const player = players[currentPlayerIndex];
  const nextName =
    mode === "solo"
      ? player?.name
      : players[(currentPlayerIndex + 1) % players.length]?.name;
  const canAdvance = !online || myTurn || host;
  const original = variant === "original";
  const quizHits =
    Number(lastResult.titleCorrect) + Number(lastResult.artistCorrect);

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-10 text-center lg:max-w-3xl">
      <p
        className={cn(
          "text-xs font-medium tracking-[0.24em] uppercase",
          lastResult.correct ? "text-success" : "text-danger",
        )}
      >
        {lastResult.correct ? "Sitzt" : "Daneben"}
      </p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">
        {lastResult.correct ? "Richtig gelegt" : "Falscher Platz"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {lastResult.correct
          ? "Die Karte bleibt auf der Zeitlinie."
          : "Die Karte wird zurückgelegt."}
        {original ? ` ${quizHits} von 2 Treffern beim Raten.` : ""}
      </p>

      <div className="mt-8 pop-in">
        <SongCard song={lastResult.song} />
      </div>

      {original ? (
        <div className="mt-6 grid w-full max-w-sm gap-2">
          <Mark
            ok={Boolean(lastResult.titleCorrect)}
            label="Titel"
            guess={lastResult.titleGuess}
            actual={lastResult.song.title}
          />
          <Mark
            ok={Boolean(lastResult.artistCorrect)}
            label="Interpret"
            guess={lastResult.artistGuess}
            actual={lastResult.song.artist}
          />
        </div>
      ) : (
        <p className="mt-6 max-w-sm text-sm text-muted">
          <span className="text-fg">{lastResult.song.title}</span>
          {" · "}
          {lastResult.song.artist}
        </p>
      )}

      {canAdvance ? (
        <Button size="lg" className="mt-10 w-full max-w-xs" disabled={pending} onClick={requestNext}>
          {nextName ? `Weiter · ${nextName}` : "Weiter"}
        </Button>
      ) : (
        <p className="mt-10 text-sm text-muted">Warten auf {player?.name ?? "den Zug"}…</p>
      )}
    </main>
  );
}
