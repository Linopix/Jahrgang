import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { localBoard } from "@/lib/game/local-scores";
import { ACCOUNT_LIVE } from "@/lib/account/flags";
import { useAccount } from "@/lib/account/client";
import { cn } from "@/lib/utils";
import type { AccountStats, BoardRange, BoardRow } from "@/lib/account/types";

const RANGES: { id: BoardRange; label: string }[] = [
  { id: "day", label: "Heute" },
  { id: "week", label: "Woche" },
  { id: "all", label: "Gesamt" },
];

type Payload = {
  day: BoardRow[];
  week: BoardRow[];
  all: BoardRow[];
  me: AccountStats | null;
};

export const Route = createFileRoute("/rangliste")({
  component: BoardPage,
});

function BoardPage() {
  if (!ACCOUNT_LIVE) {
    return (
      <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
        <a href="/" className="back-link">
          Zurück
        </a>
        <h1 className="mt-6 font-display text-4xl font-medium text-fg">Rangliste</h1>
        <p className="mt-3 text-sm text-muted">
          Die Rangliste kommt später wieder.
        </p>
      </main>
    );
  }
  return <BoardLive />;
}

function BoardLive() {
  const user = useAccount((s) => s.user);
  const hydrate = useAccount((s) => s.hydrate);
  const [range, setRange] = useState<BoardRange>("week");
  const [data, setData] = useState<Payload>({ day: [], week: [], all: [], me: null });
  const local = localBoard().slice(0, 8);
  const board = data[range];

  useEffect(() => {
    void hydrate();
    void fetch("/api/scores", { credentials: "include" })
      .then((res) => res.json())
      .then((body: Payload) =>
        setData({
          day: body.day ?? [],
          week: body.week ?? [],
          all: body.all ?? [],
          me: body.me ?? null,
        }),
      )
      .catch(() => {});
  }, [hydrate]);

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="back-link">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Rangliste</h1>
      <p className="mt-3 text-sm text-muted">
        Heute, Woche, Gesamt. Mit Konto zählt es überall.
      </p>
      <p className="mt-3 text-xs">
        <a href="/konto" className="text-subtle transition-colors duration-150 ease-out hover:text-fg">
          {user ? `Konto · ${user.name}` : "Konto anlegen"}
        </a>
      </p>

      {data.me ? <MeStrip stats={data.me} /> : null}

      <div className="mt-8 grid grid-cols-3 gap-2">
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRange(item.id)}
            className={cn(
              "h-11 rounded-md text-sm font-medium shadow-border transition-colors",
              range === item.id ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-surface",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-4">
        {board.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Leer.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {board.map((row) => (
              <li
                key={row.accountId}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-3 text-sm shadow-border",
                  user?.id === row.accountId ? "bg-primary text-primary-fg" : "bg-raised text-fg",
                )}
              >
                <span className="w-6 tabular-nums text-xs opacity-70">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                <span className="tabular-nums text-xs opacity-70">
                  {row.wins} Siege · {row.points} Pkt · {row.hit}%
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-fg">Dieses Gerät</h2>
        {local.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch nichts.</p>
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

function MeStrip({ stats }: { stats: AccountStats }) {
  const rank = (n: number | null) => (n ? `#${n}` : "—");
  return (
    <section className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Abende" value={String(stats.games)} />
      <Stat label="Siege" value={String(stats.wins)} />
      <Stat label="Treffer" value={`${stats.hit}%`} />
      <Stat
        label="Platz"
        value={`${rank(stats.rank.day)} · ${rank(stats.rank.week)} · ${rank(stats.rank.all)}`}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-3 shadow-border">
      <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-lg tabular-nums text-fg">{value}</p>
    </div>
  );
}
