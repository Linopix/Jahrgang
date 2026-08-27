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

export function Podium({ items }: { items: PodiumItem[] }) {
  const first = items[0];
  const second = items[1];
  const third = items[2];
  const cols = [
    second ? { player: second, place: 2, height: "h-28 sm:h-36", delay: "120ms" } : null,
    first ? { player: first, place: 1, height: "h-40 sm:h-52", delay: "0ms" } : null,
    third ? { player: third, place: 3, height: "h-20 sm:h-24", delay: "220ms" } : null,
  ].filter(Boolean) as { player: PodiumItem; place: number; height: string; delay: string }[];

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
          <p className="mb-2 text-xs tabular-nums text-muted">{col.player.detail}</p>
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
