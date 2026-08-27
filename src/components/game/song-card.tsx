import { cn } from "@/lib/utils";
import type { ResolvedSong } from "@/lib/game/types";

type SongCardProps = {
  song: Pick<ResolvedSong, "title" | "artist" | "year" | "artworkUrl">;
  hidden?: boolean;
  compact?: boolean;
  tv?: boolean;
  hideYear?: boolean;
  className?: string;
};

export function SongCard({ song, hidden, compact, tv, hideYear, className }: SongCardProps) {
  const yearSize = tv ? "text-5xl" : compact ? "text-3xl" : "text-4xl";
  return (
    <article
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-card text-card-fg shadow-lift transition-transform duration-150 ease-out",
        tv ? "h-48 w-36 rounded-lg p-3.5" : compact ? "h-36 w-28 rounded-md p-2.5" : "h-52 w-40 rounded-lg p-3.5",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-card-fg/10" />
      {hidden ? (
        <>
          <p className="font-display text-2xs font-medium tracking-[0.22em] text-card-muted uppercase">
            Jahrgang
          </p>
          <div className="flex flex-1 items-center justify-center">
            <div className="size-12 rounded-full bg-card-fg/10" />
          </div>
          <p className="text-2xs text-card-muted">Verdeckt</p>
        </>
      ) : (
        <>
          {hideYear ? (
            <p className="font-display text-2xs font-medium tracking-[0.22em] text-card-muted uppercase">
              ???
            </p>
          ) : (
            <p className="font-display text-2xs font-medium tracking-[0.22em] text-card-muted uppercase">
              Jahr
            </p>
          )}
          {hideYear ? (
            <p className={cn("font-display font-medium leading-none text-card-muted", yearSize)}>
              —
            </p>
          ) : (
            <p
              className={cn(
                "font-display font-medium tabular-nums leading-none tracking-tight text-card-fg",
                yearSize,
              )}
            >
              {song.year}
            </p>
          )}
          <div className="min-w-0">
            <p className={cn("truncate font-medium text-card-fg", tv || !compact ? "text-sm" : "text-xs")}>
              {song.title}
            </p>
            <p className="truncate text-2xs text-card-muted">{song.artist}</p>
          </div>
        </>
      )}
    </article>
  );
}