import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import {
  canStartNextRound,
  isOnlinePlay,
  requestAgain,
  requestBackToLobby,
  requestEndEvening,
  requestFinishCupMatch,
  requestLeave,
} from "@/lib/game/online-actions";
import { rankPlayers } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import {
  guessKind,
  NEXT_ROUND_BLURB,
  openPlay,
  SOLO_LIVES,
  VARIANT_LABELS,
  type SessionStats,
} from "@/lib/game/types";
import { recordLocalScore } from "@/lib/game/local-scores";
import { ACCOUNT_LIVE } from "@/lib/account/flags";
import { submitBoard, useAccount } from "@/lib/account/client";
import { useIsAdmin } from "@/lib/tv/mode";
import { cn } from "@/lib/utils";
import { ConfettiBurst, Podium } from "./podium";
import { TournamentBoard } from "./tournament-board";
import { TOURNAMENT_LIVE, currentMatch } from "@/lib/tournament";

function formatDuration(ms: number) {
  if (ms <= 0) return "—";
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds} s`;
  return `${minutes}:${String(seconds).padStart(2, "0")} min`;
}

function pct(part: number, whole: number) {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)} %`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-3 shadow-border">
      <p className="text-2xs tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">{value}</p>
    </div>
  );
}

function StatsGrid({ stats, title }: { stats: SessionStats; title: string }) {
  const placed = stats.placedOk + stats.placedBad;
  return (
    <section>
      <h2 className="text-sm font-medium text-fg">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Dauer" value={formatDuration(Date.now() - stats.startedAt)} />
        <Stat label="Gehört" value={String(stats.heard)} />
        <Stat label="Richtig" value={pct(stats.placedOk, placed)} />
        <Stat label="Falsch" value={pct(stats.placedBad, placed)} />
        <Stat label="Treffer" value={`${stats.placedOk}/${placed || 0}`} />
        {stats.quizAsked > 0 ? <Stat label="Ratequote" value={pct(stats.quizHits, stats.quizAsked)} /> : null}
        <Stat label="Joker" value={`${stats.hints + stats.skips}`} />
        {stats.skips > 0 ? <Stat label="Übersprungen" value={String(stats.skips)} /> : null}
      </div>
    </section>
  );
}

export function WinnerScreen() {
  const players = useGame((s) => s.players);
  const target = useGame((s) => s.target);
  const mode = useGame((s) => s.mode);
  const variant = useGame((s) => s.variant);
  const custom = useGame((s) => s.custom);
  const series = useGame((s) => s.series);
  const stats = useGame((s) => s.stats);
  const roundStats = useGame((s) => s.roundStats);
  const openSetup = useGame((s) => s.openSetup);
  const openHome = useGame((s) => s.openHome);
  const online = isOnlinePlay();
  const isHost = useIsAdmin();
  const nextRound = useOnline((s) => s.nextRound);
  const pending = useOnline((s) => s.pending);
  const selfId = useOnline((s) => s.selfId);
  const tournament = useOnline((s) => s.tournament);
  const cupOn = TOURNAMENT_LIVE && Boolean(useOnline((s) => s.cup));
  const cupMatch = cupOn ? currentMatch(tournament) : null;
  const account = useAccount((s) => s.user);
  const mayStart = !online || canStartNextRound();
  const original = guessKind(variant, custom) !== "none";
  const ranked = rankPlayers(players);
  const champ = ranked[0];
  const open = openPlay(variant, custom);
  const soloFailed =
    mode === "solo" && (champ?.misses ?? 0) >= SOLO_LIVES && (champ?.timeline.length ?? 0) < target;
  const [view, setView] = useState<"podium" | "board">("podium");

  useEffect(() => {
    const timer = window.setTimeout(() => setView("board"), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cupOn || !isHost) return;
    requestFinishCupMatch();
  }, [cupOn, isHost, players]);

  useEffect(() => {
    const mine =
      series.find((row) => row.id === selfId) ??
      (champ ? { id: champ.id, name: champ.name, wins: 1, points: champ.timeline.length + champ.quiz } : null);
    if (!mine) return;
    recordLocalScore({
      name: account?.name || mine.name,
      wins: mine.wins,
      points: mine.points,
      heard: stats.heard,
      variant,
    });
    if (ACCOUNT_LIVE && account) {
      void submitBoard({
        wins: mine.wins,
        points: mine.points,
        heard: stats.heard,
        placedOk: stats.placedOk,
        variant,
      });
    }
  }, []);

  const title = soloFailed
    ? "Platte zu Ende"
    : champ
      ? `${champ.name} ist der Jahrgang`
      : "Ende";

  if (view === "podium") {
    return (
      <main
        className="screen-in relative mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center overflow-hidden px-5 py-10 lg:max-w-6xl lg:px-8"
        onClick={() => setView("board")}
      >
        <ConfettiBurst />
        <p className="kicker">
          {soloFailed ? "Drei Fehler" : "Die Bestplatzierten"}
        </p>
        <h1 className="mt-2 text-center font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <div className="mt-12 w-full">
          <Podium
            items={ranked.map((player) => ({
              id: player.id,
              name: player.name,
              detail: open ? String(player.timeline.length) : `${player.timeline.length}/${target}`,
            }))}
          />
        </div>
        <p className="mt-10 text-sm text-muted">Tippen für die Zahlen.</p>
      </main>
    );
  }

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-8 lg:max-w-6xl lg:px-8">
      <div className="flex flex-col items-center text-center">
        <Vinyl size="sm" spinning slow />
        <p className="mt-5 kicker">
          {soloFailed ? "Drei Fehler" : VARIANT_LABELS[variant]}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {soloFailed
            ? `${champ?.timeline.length ?? 0} von ${target} Karten.`
            : open
              ? `${champ?.timeline.length ?? 0} Titel, ohne Zeitlinie-Regel.`
              : `${champ?.timeline.length ?? 0} Titel in der richtigen Reihenfolge.`}
          {original && champ ? ` ${champ.quiz} Treffer beim Raten.` : ""}
        </p>
      </div>

      {mode === "party" && ranked.length > 1 ? (
        <ol className="mt-6 space-y-2">
          {ranked.map((player) => (
            <li
              key={player.id}
              className={cn(
                "flex items-center justify-between rounded-md px-4 py-3 text-sm shadow-border",
                player.id === champ?.id ? "bg-primary text-primary-fg" : "bg-raised text-fg",
              )}
            >
              <span className="font-medium">{player.name}</span>
              <span className="tabular-nums opacity-70">
                {open ? player.timeline.length : `${player.timeline.length}/${target}`}
                {original ? ` · ${player.quiz}` : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {cupOn && tournament ? (
        <div className="mt-8 min-w-0 rounded-xl bg-surface p-4 shadow-border">
          <TournamentBoard t={tournament} compact />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {online ? (
          <>
            {mayStart ? (
              <Button
                size="lg"
                className="flex-1"
                disabled={pending}
                onClick={() => {
                  if (cupOn && tournament?.status === "done") {
                    requestBackToLobby();
                    return;
                  }
                  void requestAgain();
                }}
              >
                {cupOn
                  ? tournament?.status === "done"
                    ? "Zur Lobby"
                    : cupMatch?.stechen
                      ? "Stechen"
                      : "Nächstes Spiel"
                  : "Weiter spielen"}
              </Button>
            ) : (
              <p className="flex-1 self-center text-center text-sm text-muted">
                {cupOn ? "Nächstes Spiel vom Host." : NEXT_ROUND_BLURB[nextRound]}
              </p>
            )}
            {mayStart && !cupOn ? (
              <Button size="lg" variant="secondary" className="flex-1" onClick={requestBackToLobby}>
                {isHost ? "Zur Lobby" : "Zurück zur Lobby"}
              </Button>
            ) : null}
            <Button size="lg" variant="secondary" className="flex-1" onClick={requestLeave}>
              Raum verlassen
            </Button>
            {series.some((row) => row.wins > 0 || row.points > 0) && mayStart && !cupOn ? (
              <Button size="lg" variant="ghost" className="flex-1" onClick={requestEndEvening}>
                Abend beenden
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button size="lg" className="flex-1" onClick={() => void requestAgain()}>
              Weiter spielen
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => openSetup(mode)}>
              Einstellungen
            </Button>
            <Button size="lg" variant="ghost" className="flex-1" onClick={openHome}>
              Zum Start
            </Button>
            {series.some((row) => row.wins > 0 || row.points > 0) ? (
              <Button size="lg" variant="ghost" className="flex-1" onClick={requestEndEvening}>
                Abend beenden
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-8 space-y-8">
        <StatsGrid stats={roundStats} title="Diese Runde" />
        {stats.heard > roundStats.heard ? <StatsGrid stats={stats} title="Abend" /> : null}
      </div>

      {series.some((row) => row.wins > 0 || row.points > 0) ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-fg">Abend-Stand</h2>
          <p className="mt-1 text-sm text-muted">Gleicher Raum, gleicher Code. Siege bleiben.</p>
          <ol className="mt-3 space-y-2">
            {series.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm text-fg shadow-border"
              >
                <span className="font-medium">{row.name}</span>
                <span className="tabular-nums text-muted">
                  {row.wins} {row.wins === 1 ? "Sieg" : "Siege"} · {row.points} Pkt
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {champ ? (
        <section className="mt-8 rounded-xl bg-surface p-4 shadow-border">
          <p className="mb-2 px-1 kicker">
            Zeitlinie
          </p>
          <Timeline songs={champ.timeline} selectedSlot={null} interactive={false} />
        </section>
      ) : null}
    </main>
  );
}
