import { Plus } from "lucide-react";
import { SongCard } from "./song-card";
import { cn } from "@/lib/utils";
import type { ResolvedSong } from "@/lib/game/types";

type TimelineProps = {
  songs: ResolvedSong[];
  selectedSlot: number | null;
  onSelectSlot?: (index: number) => void;
  interactive?: boolean;
};

export function Timeline({
  songs,
  selectedSlot,
  onSelectSlot,
  interactive = true,
}: TimelineProps) {
  const slots = songs.length + 1;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-border" />
      <ol className="flex items-center gap-1 overflow-x-auto px-2 py-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {Array.from({ length: slots }, (_, index) => {
          const song = songs[index];
          const selected = selectedSlot === index;
          return (
            <li key={`slot-${index}`} className="flex shrink-0 items-center gap-1">
              {interactive ? (
                <button
                  type="button"
                  aria-label={`Platz ${index + 1} wählen`}
                  onClick={() => onSelectSlot?.(index)}
                  className={cn(
                    "flex h-36 w-11 shrink-0 items-center justify-center rounded-sm border border-dashed transition-[background-color,border-color,color,transform] duration-150 ease-out hover:-translate-y-px active:scale-[0.96]",
                    selected
                      ? "scale-105 border-primary bg-primary/20 text-primary"
                      : "border-border bg-raised/60 text-muted hover:border-primary/50 hover:text-fg",
                  )}
                >
                  <Plus className="size-4" strokeWidth={1.75} />
                </button>
              ) : null}
              {song ? <SongCard song={song} compact /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
