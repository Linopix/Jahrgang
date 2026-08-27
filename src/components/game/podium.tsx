import { useEffect } from "react";
import { sfxPodium } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

const CONFETTI = [8, 18, 28, 38, 48, 58, 68, 78, 88, 14, 42, 72, 92, 24, 54];

export function ConfettiBurst() {
  return (
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
  );
}

export type PodiumItem = {
  id: string;
  name: string;
  detail: string;
};

const RISE: Record<1 | 2 | 3, { height: string; delay: string; ms: number }> = {
  3: { height: "h-20 sm:h-24", delay: "0ms", ms: 0 },
  2: { height: "h-28 sm:h-36", delay: "550ms", ms: 550 },
  1: { height: "h-40 sm:h-52", delay: "1100ms", ms: 1100 },
};

export function Podium({ items }: { items: PodiumItem[] }) {
  const first = items[0];
  const second = items[1];
  const third = items[2];
  const cols = [
    second ? { player: second, place: 2 as const } : null,
    first ? { player: first, place: 1 as const } : null,
    third ? { player: third, place: 3 as const } : null,
  ].filter(Boolean) as { player: PodiumItem; place: 1 | 2 | 3 }[];

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const order = ([3, 2, 1] as const).filter((place) => cols.some((col) => col.place === place));
    if (reduce) {
      const last = order[order.length - 1];
      if (last) sfxPodium(last);
      return;
    }
    const timers = order.map((place) => window.setTimeout(() => sfxPodium(place), RISE[place].ms));
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [first?.id, second?.id, third?.id]);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5">
      {cols.map((col) => {
        const rise = RISE[col.place];
        return (
          <div key={col.player.id} className="flex w-24 flex-col items-center sm:w-32">
            <p
              className="podium-name mb-1 max-w-full truncate text-center font-display text-lg font-medium text-fg sm:text-xl"
              style={{ animationDelay: rise.delay }}
            >
              {col.player.name}
            </p>
            <p
              className="podium-name mb-2 text-xs tabular-nums text-muted"
              style={{ animationDelay: rise.delay }}
            >
              {col.player.detail}
            </p>
            <div
              className={cn(
                "podium-bar flex w-full items-start justify-center rounded-t-md pt-3 text-sm font-medium tracking-[0.18em] uppercase",
                rise.height,
                col.place === 1 ? "bg-primary text-primary-fg" : "bg-raised text-muted shadow-border",
              )}
              style={{ animationDelay: rise.delay }}
            >
              {col.place === 1 ? "I" : col.place === 2 ? "II" : "III"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
