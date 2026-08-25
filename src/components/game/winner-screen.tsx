import { Button } from "@/components/ui/button";
import { Timeline } from "./timeline";
import { Vinyl } from "./vinyl";
import { isOnlinePlay, requestBackToLobby, requestLeave } from "@/lib/game/online-actions";
import { rankPlayers } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { SOLO_LIVES, VARIANT_LABELS } from "@/lib/game/types";

export function WinnerScreen() {
  const players = useGame((s) => s.players);
  const target = useGame((s) => s.target);
  const mode = useGame((s) => s.mode);
  const variant = useGame((s) => s.variant);
  const openSetup = useGame((s) => s.openSetup);
  const openHome = useGame((s) => s.openHome);
  const online = isOnlinePlay();
  const isHost = useOnline((s) => s.role) === "host";
  const original = variant === "original";
  const ranked = rankPlayers(players);
  const champ = ranked[0];
  const soloFailed = mode === "solo" && (champ?.misses ?? 0) >= SOLO_LIVES && (champ?.timeline.length ?? 0) < target;
  const title = soloFailed
    ? "Platte zu Ende"
    : champ
      ? `${champ.name} ist der Jahrgang`
      : "Ende";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-10 lg:max-w-6xl lg:px-8">
      <div className="flex flex-col items-center text-center">
        <Vinyl size="sm" />
        <p className="mt-6 text-xs font-medium tracking-[0.24em] text-muted uppercase">
          {soloFailed ? "Drei Fehler" : VARIANT_LABELS[variant]}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {soloFailed
            ? `${champ?.timeline.length ?? 0} von ${target} Karten.`
            : `${champ?.timeline.length ?? 0} Titel in der richtigen Reihenfolge.`}
          {original && champ ? ` ${champ.quiz} Treffer beim Raten.` : ""}
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

      {mode === "party" && ranked.length > 1 ? (
        <ol className="mt-6 space-y-2">
          {ranked.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-md bg-raised px-4 py-3 text-sm shadow-border"
            >
              <span className="font-medium text-fg">{player.name}</span>
              <span className="tabular-nums text-muted">
                {player.timeline.length}/{target}
                {original ? ` · ${player.quiz}` : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {online ? (
          <>
            {isHost ? (
              <Button size="lg" className="flex-1" onClick={requestBackToLobby}>
                Zurück zur Lobby
              </Button>
            ) : (
              <p className="flex-1 self-center text-center text-sm text-muted">
                Der Host startet die nächste Runde.
              </p>
            )}
            <Button size="lg" variant="secondary" className="flex-1" onClick={requestLeave}>
              Raum verlassen
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="flex-1" onClick={() => openSetup(mode)}>
              Nochmal
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={openHome}>
              Zum Start
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
