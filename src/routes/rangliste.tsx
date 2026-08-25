import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { localBoard } from "@/lib/game/local-scores";
import { useAccount } from "@/lib/account/client";

type BoardRow = {
  accountId: string;
  name: string;
  wins: number;
  points: number;
  heard: number;
};

export const Route = createFileRoute("/rangliste")({
  component: BoardPage,
});

function BoardPage() {
  const user = useAccount((s) => s.user);
  const hydrate = useAccount((s) => s.hydrate);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const local = localBoard().slice(0, 12);

  useEffect(() => {
    void hydrate();
    void fetch("/api/scores")
      .then((res) => res.json())
      .then((body: { board?: BoardRow[] }) => setBoard(body.board ?? []))
      .catch(() => setBoard([]));
  }, [hydrate]);

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Rangliste</h1>
      <p className="mt-3 text-sm text-muted">
        Mit Konto zählt der Abend über Geräte. Sonst nur hier.
      </p>
      <p className="mt-3 text-xs">
        <a href="/konto" className="text-subtle hover:text-fg">
          {user ? `Konto · ${user.name}` : "Konto anlegen"}
        </a>
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-fg">Konten</h2>
        {board.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine verbundenen Abende.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {board.map((row, i) => (
              <li
                key={row.accountId}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm shadow-border ${user?.id === row.accountId ? "bg-primary text-primary-fg" : "bg-raised text-fg"}`}
              >
                <span className="w-6 tabular-nums text-xs opacity-70">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                <span className="tabular-nums text-xs opacity-70">
                  {row.wins} Siege · {row.points} Pkt
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-fg">Dieses Gerät</h2>
        {local.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine Runde hier.</p>
        ) : (
          <ol className="mt-3 space-y-2">
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
