import { Button } from "@/components/ui/button";
import { SongCard } from "./song-card";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function RevealScreen() {
  const lastResult = useGame((s) => s.lastResult);
  const nextTurn = useGame((s) => s.nextTurn);
  const players = useGame((s) => s.players);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const mode = useGame((s) => s.mode);

  if (!lastResult) return null;
  const player = players[currentPlayerIndex];
  const nextName =
    mode === "solo"
      ? player?.name
      : players[(currentPlayerIndex + 1) % players.length]?.name;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-10 text-center">
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
          : "Die Karte wandert zurück. Nächste Runde."}
      </p>

      <div className="mt-8">
        <SongCard song={lastResult.song} />
      </div>

      <p className="mt-6 max-w-sm text-sm text-muted">
        <span className="text-fg">{lastResult.song.title}</span>
        {" · "}
        {lastResult.song.artist}
      </p>

      <Button size="lg" className="mt-10 w-full max-w-xs" onClick={nextTurn}>
        {nextName ? `Weiter · ${nextName}` : "Weiter"}
      </Button>
    </main>
  );
}
