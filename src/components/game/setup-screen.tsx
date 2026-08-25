import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameOptions } from "./game-options";
import { useGame } from "@/lib/game/store";
import { DEFAULT_ROOM_CONFIG, type RoomConfig } from "@/lib/game/types";
import { sfxScratch } from "@/lib/game/audio";

const PARTY_NAMES = ["Alex", "Sam", "Kim", "Jo", "Mo", "Lee", "Nik", "Rae"];

export function SetupScreen() {
  const mode = useGame((s) => s.mode);
  const loadError = useGame((s) => s.loadError);
  const startGame = useGame((s) => s.startGame);
  const openHome = useGame((s) => s.openHome);

  const [count, setCount] = useState(mode === "solo" ? 1 : 3);
  const [names, setNames] = useState(mode === "solo" ? ["Du"] : PARTY_NAMES);
  const [options, setOptions] = useState<RoomConfig>(DEFAULT_ROOM_CONFIG);

  const visibleNames = useMemo(
    () => (mode === "solo" ? names.slice(0, 1) : names.slice(0, count)),
    [mode, names, count],
  );

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 lg:max-w-6xl lg:px-8">
      <button
        type="button"
        onClick={openHome}
        className="self-start text-sm text-muted transition-colors hover:text-fg"
      >
        Zurück
      </button>
      <div className="lg:mt-6 lg:grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-8">
          <h1 className="mt-6 font-display text-4xl font-medium text-fg lg:mt-0 lg:text-5xl">
            {mode === "solo" ? "Solo" : "Partyabend"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "solo"
              ? "Drei Fehlversuche. Ziel ist eine vollständige Zeitlinie."
              : "Ein Gerät, reihum. Wer am Zug ist, legt auf der eigenen Zeitlinie."}
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
        </div>

        <div className="lg:pt-0">
          <GameOptions
            value={options}
            onChange={(patch) => setOptions((current) => ({ ...current, ...patch }))}
          />
        </div>

        <div className="lg:col-span-2">
          {loadError ? (
            <p className="mt-6 rounded-md bg-danger/15 px-3 py-2 text-sm text-fg">{loadError}</p>
          ) : null}

          <Button
            size="lg"
            className="mt-8 w-full lg:max-w-xs"
            onClick={() => {
              sfxScratch();
              void startGame({
                mode,
                names: visibleNames,
                ...options,
              });
            }}
          >
            Platte auflegen
          </Button>
        </div>
      </div>
    </main>
  );
}
