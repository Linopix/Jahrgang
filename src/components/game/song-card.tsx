import { cn } from "@/lib/utils";
import type { ResolvedSong } from "@/lib/game/types";

type SongCardProps = {
  song: Pick<ResolvedSong, "title" | "artist" | "year" | "artworkUrl">;
  hidden?: boolean;
  compact?: boolean;
  className?: string;
};

export function SongCard({ song, hidden, compact, className }: SongCardProps) {
  return (
    <article
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-card text-card-fg shadow-lift",
        compact
          ? "h-36 w-28 rounded-md p-2.5"
          : "h-52 w-40 rounded-lg p-3.5",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-card-fg/10" />
      {hidden ? (
        <>
          <p className="font-display text-[0.65rem] font-medium tracking-[0.22em] text-card-muted uppercase">
            Jahrgang
          </p>
          <div className="flex flex-1 items-center justify-center">
            <div className="size-12 rounded-full bg-card-fg/10" />
          </div>
          <p className="text-[0.7rem] text-card-muted">Verdeckt</p>
        </>
      ) : (
        <>
          <p className="font-display text-[0.65rem] font-medium tracking-[0.22em] text-card-muted uppercase">
            Jahr
          </p>
          <p
            className={cn(
              "font-display font-medium tabular-nums leading-none tracking-tight text-card-fg",
              compact ? "text-3xl" : "text-4xl",
            )}
          >
            {song.year}
          </p>
          <div className="min-w-0">
            <p className={cn("truncate font-medium text-card-fg", compact ? "text-xs" : "text-sm")}>
              {song.title}
            </p>
            <p className="truncate text-[0.7rem] text-card-muted">{song.artist}</p>
          </div>
        </>
      )}
    </article>
  );
}
