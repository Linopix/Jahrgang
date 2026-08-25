import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game/store";
import { ERA_LABELS, TARGET_OPTIONS, type EraId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const ERAS = Object.keys(ERA_LABELS) as EraId[];
const PARTY_NAMES = ["Alex", "Sam", "Kim", "Jo", "Mo", "Lee", "Nik", "Rae"];

export function SetupScreen() {
  const mode = useGame((s) => s.mode);
  const loadError = useGame((s) => s.loadError);
  const startGame = useGame((s) => s.startGame);
  const openHome = useGame((s) => s.openHome);

  const [count, setCount] = useState(mode === "solo" ? 1 : 3);
  const [names, setNames] = useState(mode === "solo" ? ["Du"] : PARTY_NAMES);
  const [target, setTarget] = useState<6 | 8 | 10>(8);
  const [era, setEra] = useState<EraId>("all");

  const visibleNames = useMemo(
    () => (mode === "solo" ? names.slice(0, 1) : names.slice(0, count)),
    [mode, names, count],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
      <button
        type="button"
        onClick={openHome}
        className="self-start text-sm text-muted transition-colors hover:text-fg"
      >
        Zurück
      </button>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">
        {mode === "solo" ? "Solo" : "Partyabend"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "solo"
          ? "Drei Fehler, dann ist Schluss. Schaffe das Ziel auf einer Zeitlinie."
          : "Ein Bildschirm, reihum legen. Der aktuelle Name steht groß – Gerät weitergeben."}
      </p>

      {mode === "party" ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-fg">Spieler</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="size-10"
                aria-label="Weniger Spieler"
                disabled={count <= 2}
                onClick={() => setCount((n) => Math.max(2, n - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-6 text-center tabular-nums">{count}</span>
              <Button
                variant="secondary"
                size="icon"
                className="size-10"
                aria-label="Mehr Spieler"
                disabled={count >= 8}
                onClick={() => setCount((n) => Math.min(8, n + 1))}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-6 space-y-2">
        {visibleNames.map((name, i) => (
          <label key={i} className="block">
            <span className="sr-only">Name {i + 1}</span>
            <input
              value={name}
              onChange={(event) => {
                const next = names.slice();
                next[i] = event.target.value;
                setNames(next);
              }}
              className="h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] focus:ring-2 focus:ring-primary/70"
              maxLength={18}
            />
          </label>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Ziel</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TARGET_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTarget(value)}
              className={cn(
                "h-12 rounded-md text-sm font-medium transition-colors",
                target === value
                  ? "bg-primary text-primary-fg"
                  : "bg-raised text-fg shadow-border hover:bg-surface",
              )}
            >
              {value} Karten
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Repertoire</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ERAS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setEra(id)}
              className={cn(
                "h-10 rounded-full px-3.5 text-sm transition-colors",
                era === id
                  ? "bg-primary text-primary-fg"
                  : "bg-raised text-muted shadow-border hover:text-fg",
              )}
            >
              {ERA_LABELS[id]}
            </button>
          ))}
        </div>
      </section>

      {loadError ? (
        <p className="mt-6 rounded-md bg-danger/15 px-3 py-2 text-sm text-fg">{loadError}</p>
      ) : null}

      <Button
        size="lg"
        className="mt-10 w-full"
        onClick={() =>
          void startGame({
            mode,
            names: visibleNames,
            target,
            era,
          })
        }
      >
        Platte auflegen
      </Button>
    </main>
  );
}
