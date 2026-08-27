import { Button } from "@/components/ui/button";
import { rankSeries } from "@/lib/game/engine";
import { useSessionExit } from "@/lib/game/session-exit";
import { ConfettiBurst, Podium } from "./podium";

function formatDuration(ms: number) {
  if (ms <= 0) return "—";
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds} s`;
  return `${minutes}:${String(seconds).padStart(2, "0")} min`;
}

export function ExitScreen() {
  const kind = useSessionExit((s) => s.kind);
  const name = useSessionExit((s) => s.name);
  const player = useSessionExit((s) => s.player);
  const place = useSessionExit((s) => s.place);
  const stats = useSessionExit((s) => s.stats);
  const roundStats = useSessionExit((s) => s.roundStats);
  const series = useSessionExit((s) => s.series);
  const clear = useSessionExit((s) => s.clear);

  if (!kind) return null;

  if (kind === "evening") {
    const ranked = rankSeries(series);
    return (
      <main className="screen-in relative mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center overflow-hidden px-5 py-10">
        <ConfettiBurst />
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Der ganze Abend</p>
        <h1 className="mt-2 text-center font-display text-4xl font-medium text-fg sm:text-5xl">
          {ranked[0] ? `${ranked[0].name} führt den Abend` : "Abend"}
        </h1>
        <div className="mt-12 w-full">
          <Podium
            items={ranked.map((row) => ({
              id: row.id,
              name: row.name,
              detail: `${row.wins} ${row.wins === 1 ? "Sieg" : "Siege"} · ${row.points} Pkt`,
            }))}
          />
        </div>
        <ol className="mt-10 w-full max-w-md space-y-2">
          {ranked.map((row, i) => (
            <li
              key={row.id}
              className="flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm text-fg shadow-border"
            >
              <span className="font-medium">
                {i + 1}. {row.name}
              </span>
              <span className="tabular-nums text-muted">
                {row.wins} {row.wins === 1 ? "Sieg" : "Siege"} · {row.points} Pkt
              </span>
            </li>
          ))}
        </ol>
        <Button size="lg" className="mt-10 min-w-48" onClick={clear}>
          Weiter
        </Button>
      </main>
    );
  }

  const used = roundStats.placedOk + roundStats.placedBad;
  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-10">
      <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Du bist raus</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">{name || "Dein Abend"}</h1>
      <p className="mt-3 text-sm text-muted">
        {place > 0 ? `Platz ${place} in dieser Runde.` : "Die anderen spielen weiter."}
        {player ? ` ${player.timeline.length} Karten, ${player.quiz} Treffer.` : ""}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-raised px-3 py-3 shadow-border">
          <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Gehört</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">{roundStats.heard || stats.heard}</p>
        </div>
        <div className="rounded-md bg-raised px-3 py-3 shadow-border">
          <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Richtig</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">
            {used ? `${roundStats.placedOk}/${used}` : "—"}
          </p>
        </div>
        <div className="rounded-md bg-raised px-3 py-3 shadow-border">
          <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Dauer</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">
            {formatDuration(Date.now() - (roundStats.startedAt || stats.startedAt))}
          </p>
        </div>
        <div className="rounded-md bg-raised px-3 py-3 shadow-border">
          <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">Abend</p>
          <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">
            {series.find((row) => row.name === name)?.wins ?? 0} Siege
          </p>
        </div>
      </div>
      <Button size="lg" className="mt-10" onClick={clear}>
        Zum Start
      </Button>
    </main>
  );
}
