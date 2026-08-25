import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import {
  canStartNextRound,
  isOnlinePlay,
  requestAgain,
  requestBackToLobby,
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
  type Player,
  type SessionStats,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

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
      <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium tabular-nums text-fg">{value}</p>
    </div>
  );
}

const CONFETTI = [8, 18, 28, 38, 48, 58, 68, 78, 88, 14, 42, 72, 92, 24, 54];

function Podium({ ranked, target, open }: { ranked: Player[]; target: number; open?: boolean }) {
  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  const cols = [
    second ? { player: second, place: 2, height: "h-28 sm:h-36", delay: "120ms" } : null,
    first ? { player: first, place: 1, height: "h-40 sm:h-52", delay: "0ms" } : null,
    third ? { player: third, place: 3, height: "h-20 sm:h-24", delay: "220ms" } : null,
  ].filter(Boolean) as { player: Player; place: number; height: string; delay: string }[];

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5">
      {cols.map((col) => (
          <div key={col.player.id} className="flex w-24 flex-col items-center sm:w-32">
            <p
              className="podium-name mb-1 max-w-full truncate text-center font-display text-lg font-medium text-fg sm:text-xl"
              style={{ animationDelay: col.delay }}
            >
              {col.player.name}
            </p>
            <p className="mb-2 text-xs tabular-nums text-muted">
              {open ? col.player.timeline.length : `${col.player.timeline.length}/${target}`}
            </p>
            <div
              className={cn(
                "podium-bar flex w-full items-start justify-center rounded-t-md pt-3 text-sm font-medium tracking-[0.18em] uppercase",
                col.height,
                col.place === 1 ? "bg-primary text-primary-fg" : "bg-raised text-muted shadow-border",
              )}
              style={{ animationDelay: col.delay }}
            >
              {col.place === 1 ? "I" : col.place === 2 ? "II" : "III"}
            </div>
          </div>
        ))}
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
  const series = useGame((s) => s.series);
  const stats = useGame((s) => s.stats);
  const roundStats = useGame((s) => s.roundStats);
  const openSetup = useGame((s) => s.openSetup);
  const openHome = useGame((s) => s.openHome);
  const online = isOnlinePlay();
  const isHost = useOnline((s) => s.role) === "host";
  const nextRound = useOnline((s) => s.nextRound);
  const pending = useOnline((s) => s.pending);
  const mayStart = !online || canStartNextRound();
  const original = guessKind(variant) !== "none";
  const ranked = rankPlayers(players);
  const champ = ranked[0];
  const soloFailed =
    mode === "solo" && (champ?.misses ?? 0) >= SOLO_LIVES && (champ?.timeline.length ?? 0) < target;
  const [view, setView] = useState<"podium" | "board">("podium");

  useEffect(() => {
    const timer = window.setTimeout(() => setView("board"), 3400);
    return () => window.clearTimeout(timer);
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
        <div className="podium-burst" aria-hidden="true">
          {CONFETTI.map((left, i) => (
            <i
              key={i}
              style={{
                left: `${left}%`,
                animationDelay: `${i * 70}ms`,
                height: i % 2 === 0 ? "1.25rem" : "0.8rem",
              }}
            />
          ))}
        </div>
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">
          {soloFailed ? "Drei Fehler" : "Die Bestplatzierten"}
        </p>
        <h1 className="mt-2 text-center font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <div className="mt-12 w-full">
          <Podium ranked={ranked} target={target} open={openPlay(variant)} />
        </div>
        <p className="mt-10 text-sm text-muted">Tippen für die Zahlen.</p>
      </main>
    );
  }

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-10 lg:max-w-6xl lg:px-8">
      <div className="flex flex-col items-center text-center">
        <Vinyl size="sm" spinning slow />
        <p className="mt-6 text-xs font-medium tracking-[0.24em] text-muted uppercase">
          {soloFailed ? "Drei Fehler" : VARIANT_LABELS[variant]}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {soloFailed
            ? `${champ?.timeline.length ?? 0} von ${target} Karten.`
            : openPlay(variant)
              ? `${champ?.timeline.length ?? 0} Titel, ohne Zeitlinie-Regel.`
              : `${champ?.timeline.length ?? 0} Titel in der richtigen Reihenfolge.`}
          {original && champ ? ` ${champ.quiz} Treffer beim Raten.` : ""}
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <StatsGrid stats={roundStats} title="Diese Runde" />
        {stats.heard > roundStats.heard ? <StatsGrid stats={stats} title="Abend" /> : null}
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
                {openPlay(variant) ? player.timeline.length : `${player.timeline.length}/${target}`}
                {original ? ` · ${player.quiz}` : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

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
          <p className="mb-2 px-1 text-xs font-medium tracking-[0.18em] text-muted uppercase">
            Zeitlinie
          </p>
          <Timeline songs={champ.timeline} selectedSlot={null} interactive={false} />
        </section>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {online ? (
          <>
            {mayStart ? (
              <Button
                size="lg"
                className="flex-1"
                disabled={pending}
                onClick={() => void requestAgain()}
              >
                Weiter spielen
              </Button>
            ) : (
              <p className="flex-1 self-center text-center text-sm text-muted">
                {NEXT_ROUND_BLURB[nextRound]}
              </p>
            )}
            {mayStart ? (
              <Button size="lg" variant="secondary" className="flex-1" onClick={requestBackToLobby}>
                {isHost ? "Zur Lobby" : "Zurück zur Lobby"}
              </Button>
            ) : null}
            <Button size="lg" variant="secondary" className="flex-1" onClick={requestLeave}>
              Raum verlassen
            </Button>
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
          </>
        )}
      </div>
    </main>
  );
}
