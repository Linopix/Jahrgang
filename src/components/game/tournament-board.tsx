import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import {
  currentMatch,
  matchTitle,
  playerOf,
  ROUND_LABELS,
  type CupMatch,
  type Tournament,
} from "@/lib/tournament";

function nameOf(t: Tournament, id: string) {
  return playerOf(t, id)?.name ?? "Frei";
}

function MatchRow({ match, t, live }: { match: CupMatch; t: Tournament; live?: boolean }) {
  const names = match.playerIds.map((id) => nameOf(t, id));
  const label = names.length ? names.join(" · ") : "steht noch aus";
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm shadow-border",
        live ? "bg-primary text-primary-fg" : "bg-raised text-fg",
      )}
    >
      <span className="min-w-0 truncate font-medium">{label}</span>
      <span className={cn("shrink-0 text-xs tabular-nums", live ? "opacity-80" : "text-muted")}>
        {match.bye ? "Freilos" : match.status === "done" ? nameOf(t, match.winnerIds[0] ?? "") : match.status === "live" ? "läuft" : "offen"}
      </span>
    </li>
  );
}

export function TournamentBoard({
  t,
  compact = false,
  tv = false,
}: {
  t: Tournament;
  compact?: boolean;
  tv?: boolean;
}) {
  const live = currentMatch(t);
  const groups = t.groups;
  const knockout = t.matches.filter((row) => row.kind === "knockout");
  const rounds = ["r16", "qf", "sf", "final"] as const;
  const champ = t.championId ? nameOf(t, t.championId) : null;

  return (
    <div className={cn(tv ? "gap-6" : "gap-4", "grid", compact ? "gap-3" : "lg:grid-cols-2")}>
      {live ? (
        <p className={cn("lg:col-span-2 text-sm", tv ? "text-lg text-fg" : "text-muted")}>
          {matchTitle(live, t)}
          {live.stechen ? " · Stechen" : ""} · {live.playerIds.map((id) => nameOf(t, id)).join(" · ")}
        </p>
      ) : champ ? (
        <p className={cn("lg:col-span-2 font-medium", tv ? "tv-title" : "text-fg")}>Sieger: {champ}</p>
      ) : null}

      {groups.length > 0 ? (
        <section>
          <h2 className={tv ? "text-sm tracking-[0.18em] text-muted uppercase" : "text-sm font-medium text-fg"}>
            Gruppen
          </h2>
          <div className={cn("mt-3 grid gap-3", groups.length > 4 ? "sm:grid-cols-2" : "")}>
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl bg-raised p-3 shadow-border">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">Gruppe {group.label}</p>
                <ol className="mt-2 space-y-1">
                  {(group.table.length ? group.table : group.playerIds.map((id, i) => ({
                    id,
                    name: nameOf(t, id),
                    rank: i + 1,
                    cards: 0,
                    quiz: 0,
                    wins: 0,
                    played: 0,
                    misses: 0,
                  }))).map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-2 text-sm text-fg">
                      <span className="min-w-0 truncate">
                        <span className="tabular-nums text-muted">{row.rank || "–"} </span>
                        {row.name}
                      </span>
                      {row.played ? (
                        <span className="tabular-nums text-muted">
                          {row.cards} · {row.quiz}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {knockout.length > 0 ? (
        <section>
          <h2 className={tv ? "text-sm tracking-[0.18em] text-muted uppercase" : "text-sm font-medium text-fg"}>
            K.o.
          </h2>
          <div className="mt-3 space-y-4">
            {rounds.map((round) => {
              const list = knockout.filter((row) => row.round === round);
              if (!list.length) return null;
              return (
                <div key={round}>
                  <p className="mb-2 text-xs tracking-[0.16em] text-muted uppercase">{ROUND_LABELS[round]}</p>
                  <ul className="space-y-1">
                    {list.map((match) => (
                      <MatchRow key={match.id} match={match} t={t} live={live?.id === match.id} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <h2 className={tv ? "text-sm tracking-[0.18em] text-muted uppercase" : "text-sm font-medium text-fg"}>
            Ansetzungen
          </h2>
          <ul className="mt-3 space-y-1">
            {t.matches.map((match) => (
              <MatchRow key={match.id} match={match} t={t} live={live?.id === match.id} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function TournamentWatch() {
  const t = useOnline((s) => s.tournament);
  const players = useGame((s) => s.players);
  const phase = useGame((s) => s.phase);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const current = players[currentPlayerIndex];
  if (!t) {
    return (
      <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <p className="kicker">Turnier</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg">Pause</h1>
        <p className="mt-3 text-sm text-muted">Du spielst in dieser Begegnung nicht. Die Tafel kommt, sobald der Host weitermacht.</p>
      </main>
    );
  }
  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-8 lg:px-8">
      <p className="kicker">Zuschauen</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">Turnier</h1>
      {phase === "listen" || phase === "reveal" ? (
        <p className="mt-3 text-sm text-muted">
          {current ? `Dran: ${current.name}` : "Es läuft eine Begegnung."}
          {players.length ? ` Stand: ${players.map((row) => `${row.name} ${row.timeline.length}`).join(" · ")}` : ""}
        </p>
      ) : null}
      <div className="mt-6">
        <TournamentBoard t={t} />
      </div>
    </main>
  );
}

