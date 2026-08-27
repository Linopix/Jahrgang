import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { TOURNAMENT_LIVE } from "@/lib/tournament/flags";
import {
  currentMatch,
  matchTitle,
  playerOf,
  ROUND_LABELS,
  type CupMatch,
  type Tournament,
} from "@/lib/tournament";

const KO_ROUNDS = ["r16", "qf", "sf", "final"] as const;

function nameOf(t: Tournament, id: string | undefined) {
  if (!id) return "—";
  return playerOf(t, id)?.name ?? "Frei";
}

function matchStatus(match: CupMatch, t: Tournament) {
  if (match.bye) return "Freilos";
  if (match.status === "live") return match.stechen ? "Stechen" : "läuft";
  if (match.status === "done") {
    const winner = match.winnerIds[0];
    return winner ? nameOf(t, winner) : "fertig";
  }
  return "offen";
}

function MatchCard({
  match,
  t,
  live,
  tv,
}: {
  match: CupMatch;
  t: Tournament;
  live?: boolean;
  tv?: boolean;
}) {
  const a = match.playerIds[0];
  const b = match.playerIds[1];
  const extra = match.playerIds.slice(2);
  const winner = match.winnerIds[0];
  return (
    <article
      className={cn(
        "cup-match",
        live && "is-live",
        match.bye && "is-bye",
        match.status === "done" && "is-done",
        tv && "is-tv",
      )}
    >
      <p className={cn("cup-player", winner === a && "is-win")}>{nameOf(t, a)}</p>
      <p className={cn("cup-player", winner === b && "is-win")}>
        {b ? nameOf(t, b) : match.bye ? "Freilos" : "steht noch aus"}
      </p>
      {extra.map((id) => (
        <p key={id} className={cn("cup-player", winner === id && "is-win")}>
          {nameOf(t, id)}
        </p>
      ))}
      <p className="cup-match-status">{matchStatus(match, t)}</p>
    </article>
  );
}

function GroupCard({
  t,
  groupId,
  live,
  tv,
}: {
  t: Tournament;
  groupId: string;
  live?: boolean;
  tv?: boolean;
}) {
  const group = t.groups.find((row) => row.id === groupId);
  if (!group) return null;
  const rows = group.table.length
    ? group.table
    : group.playerIds.map((id, i) => ({
        id,
        name: nameOf(t, id),
        rank: i + 1,
        cards: 0,
        quiz: 0,
        wins: 0,
        played: 0,
        misses: 0,
      }));
  return (
    <section className={cn("cup-group", live && "is-live", tv && "is-tv")}>
      <p className="cup-group-label">Gruppe {group.label}</p>
      <ol className="cup-group-table">
        {rows.map((row) => (
          <li key={row.id} className="cup-group-row">
            <span className="cup-group-name">
              <span className="cup-group-rank">{row.rank || "–"}</span>
              {row.name}
            </span>
            {row.played ? (
              <span className="cup-group-score">
                {row.cards} · {row.quiz}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
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
  if (!TOURNAMENT_LIVE) return null;
  const live = currentMatch(t);
  const groups = t.groups;
  const knockout = t.matches.filter((row) => row.kind === "knockout");
  const champ = t.championId ? nameOf(t, t.championId) : null;
  const liveGroupId = live?.kind === "group" ? live.groupId : undefined;

  return (
    <div className={cn("cup-board", compact && "is-compact", tv && "is-tv")}>
      {live ? (
        <p className="cup-live">
          {matchTitle(live, t)}
          {live.stechen ? " · Stechen" : ""}
          {live.playerIds.length ? ` · ${live.playerIds.map((id) => nameOf(t, id)).join(" · ")}` : ""}
        </p>
      ) : champ ? (
        <p className="cup-live is-done">Sieger: {champ}</p>
      ) : null}

      {groups.length > 0 ? (
        <section className="min-w-0">
          <h2 className="cup-heading">Gruppen</h2>
          <div className="cup-groups">
            {groups.map((group) => (
              <GroupCard key={group.id} t={t} groupId={group.id} live={liveGroupId === group.id} tv={tv} />
            ))}
          </div>
        </section>
      ) : null}

      {knockout.length > 0 ? (
        <section className="min-w-0">
          <h2 className="cup-heading">K.o.</h2>
          <div className="cup-bracket" role="list">
            {KO_ROUNDS.map((round) => {
              const list = knockout.filter((row) => row.round === round);
              if (!list.length) return null;
              return (
                <div key={round} className="cup-round" role="listitem">
                  <p className="cup-round-label">{ROUND_LABELS[round]}</p>
                  <div className="cup-round-list">
                    {list.map((match) => (
                      <MatchCard key={match.id} match={match} t={t} live={live?.id === match.id} tv={tv} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function TournamentWatch() {
  const t = useOnline((s) => s.tournament);
  const players = useGame((s) => s.players);
  const phase = useGame((s) => s.phase);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const current = players[currentPlayerIndex];
  if (!TOURNAMENT_LIVE) return null;
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
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 lg:px-8">
      <p className="kicker">Zuschauen</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-fg">Turnier</h1>
      {phase === "listen" || phase === "reveal" ? (
        <p className="mt-3 text-sm text-muted">
          {current ? `Dran: ${current.name}` : "Es läuft eine Begegnung."}
          {players.length ? ` Stand: ${players.map((row) => `${row.name} ${row.timeline.length}`).join(" · ")}` : ""}
        </p>
      ) : null}
      <div className="mt-6 min-w-0">
        <TournamentBoard t={t} />
      </div>
    </main>
  );
}
