import { Plus } from "lucide-react";
import { SongCard } from "./song-card";
import { cn } from "@/lib/utils";
import type { ResolvedSong } from "@/lib/game/types";

type TimelineProps = {
  songs: ResolvedSong[];
  selectedSlot: number | null;
  onSelectSlot?: (index: number) => void;
  interactive?: boolean;
  hideYear?: boolean;
};

export function Timeline({
  songs,
  selectedSlot,
  onSelectSlot,
  interactive = true,
  hideYear = false,
}: TimelineProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-border lg:hidden" />
      <ol className="flex w-full items-center gap-x-1 gap-y-4 overflow-x-auto px-2 py-2 pb-3 [scrollbar-width:thin] lg:flex-wrap lg:content-start lg:overflow-visible lg:pb-1">
        {interactive ? (
          <li className="relative flex shrink-0 items-center">
            <Hairline />
            <SlotButton index={0} selected={selectedSlot === 0} onSelect={onSelectSlot} />
          </li>
        ) : null}
        {songs.map((song, index) => (
          <li key={song.id} className="relative flex shrink-0 items-center gap-1">
            <Hairline />
            <SongCard song={song} compact hideYear={hideYear} />
            {interactive ? (
              <SlotButton
                index={index + 1}
                selected={selectedSlot === index + 1}
                onSelect={onSelectSlot}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Hairline() {
  return (
    <div
      className="pointer-events-none absolute top-1/2 right-[-2px] left-[-2px] hidden h-px -translate-y-1/2 bg-border lg:block"
      aria-hidden
    />
  );
}

function SlotButton({
  index,
  selected,
  onSelect,
}: {
  index: number;
  selected: boolean;
  onSelect?: (index: number) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Platz ${index + 1} wählen`}
      onClick={() => onSelect?.(index)}
      className={cn(
        "relative z-10 flex h-36 w-11 shrink-0 items-center justify-center rounded-sm border border-dashed transition-[background-color,border-color,color,transform] duration-150 ease-out hover:-translate-y-px active:scale-[0.96]",
        selected
          ? "scale-105 border-primary bg-primary/20 text-primary"
          : "border-border bg-raised/60 text-muted hover:border-primary/50 hover:text-fg",
      )}
    >
      <Plus className="size-4" strokeWidth={1.75} />
    </button>
  );
}
