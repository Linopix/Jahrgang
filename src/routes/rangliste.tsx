import { createFileRoute } from "@tanstack/react-router";
import { localBoard } from "@/lib/game/local-scores";

export const Route = createFileRoute("/rangliste")({
  component: BoardPage,
});

function BoardPage() {
  const local = localBoard().slice(0, 16);

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Rangliste</h1>
      <p className="mt-3 text-sm text-muted">Die Abende auf diesem Gerät.</p>

      <section className="mt-10">
        {local.length === 0 ? (
          <p className="text-sm text-muted">Noch keine Runde hier.</p>
        ) : (
          <ol className="space-y-2">
            {local.map((row, i) => (
              <li
                key={`${row.at}-${i}`}
                className="flex items-center gap-3 rounded-md bg-raised px-4 py-3 text-sm text-fg shadow-border"
              >
                <span className="w-6 tabular-nums text-xs text-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                <span className="tabular-nums text-xs text-subtle">
                  {row.wins} Siege · {row.points} Pkt
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
