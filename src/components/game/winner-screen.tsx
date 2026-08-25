import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import { useGame } from "@/lib/game/store";
import { SOLO_LIVES } from "@/lib/game/types";

export function WinnerScreen() {
  const players = useGame((s) => s.players);
  const target = useGame((s) => s.target);
  const mode = useGame((s) => s.mode);
  const openSetup = useGame((s) => s.openSetup);
  const openHome = useGame((s) => s.openHome);

  const champ = [...players].sort((a, b) => b.timeline.length - a.timeline.length)[0];
  const soloFailed = mode === "solo" && (champ?.misses ?? 0) >= SOLO_LIVES && (champ?.timeline.length ?? 0) < target;
  const title = soloFailed
    ? "Platte zu Ende"
    : champ
      ? `${champ.name} ist der Jahrgang`
      : "Ende";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-10">
      <div className="flex flex-col items-center text-center">
        <Vinyl size="sm" />
        <p className="mt-6 text-xs font-medium tracking-[0.24em] text-muted uppercase">
          {soloFailed ? "Drei Fehler" : "Gewonnen"}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {soloFailed
            ? `${champ?.timeline.length ?? 0} von ${target} Karten. Nochmal auflegen und die Jahre schärfer hören.`
            : `${champ?.timeline.length ?? 0} Hits in der richtigen Reihenfolge.`}
        </p>
      </div>

      {champ ? (
        <section className="mt-10 rounded-xl bg-surface p-4 shadow-border">
          <p className="mb-2 px-1 text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Zeitlinie
          </p>
          <Timeline songs={champ.timeline} selectedSlot={null} interactive={false} />
        </section>
      ) : null}

      {mode === "party" && players.length > 1 ? (
        <ol className="mt-6 space-y-2">
          {players
            .slice()
            .sort((a, b) => b.timeline.length - a.timeline.length)
            .map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm shadow-border"
              >
                <span className="font-medium text-fg">{player.name}</span>
                <span className="tabular-nums text-muted">
                  {player.timeline.length}/{target}
                </span>
              </li>
            ))}
        </ol>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" onClick={() => openSetup(mode)}>
          Nochmal
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={openHome}>
          Zum Start
        </Button>
      </div>
    </main>
  );
}
