import { Plus } from "lucide-react";
import { SongCard } from "./song-card";
import { cn } from "@/lib/utils";
import type { ResolvedSong } from "@/lib/game/types";

type TimelineProps = {
  songs: ResolvedSong[];
  selectedSlot: number | null;
  onSelectSlot?: (index: number) => void;
  interactive?: boolean;
  showSlots?: boolean;
  hideYear?: boolean;
};

export function Timeline({
  songs,
  selectedSlot,
  onSelectSlot,
  interactive = true,
  showSlots,
  hideYear = false,
}: TimelineProps) {
  const slots = showSlots ?? interactive;
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-border lg:hidden" />
      <ol className="flex w-full items-center gap-x-1 gap-y-4 overflow-x-auto px-2 py-2 pb-3 [scrollbar-width:thin] lg:flex-wrap lg:content-start lg:overflow-visible lg:pb-1">
        {slots ? (
          <li className="relative flex shrink-0 items-center">
            <Hairline />
            <SlotMark
              index={0}
              selected={selectedSlot === 0}
              onSelect={onSelectSlot}
              interactive={interactive}
            />
          </li>
        ) : null}
        {songs.map((song, index) => (
          <li key={song.id} className="relative flex shrink-0 items-center gap-1">
            <Hairline />
            <SongCard song={song} compact hideYear={hideYear} />
            {slots ? (
              <SlotMark
                index={index + 1}
                selected={selectedSlot === index + 1}
                onSelect={onSelectSlot}
                interactive={interactive}
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

function SlotMark({
  index,
  selected,
  onSelect,
  interactive,
}: {
  index: number;
  selected: boolean;
  onSelect?: (index: number) => void;
  interactive: boolean;
}) {
  const look = cn(
    "relative z-10 flex h-36 w-12 shrink-0 items-center justify-center rounded-sm border border-dashed transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out",
    selected
      ? "scale-105 border-primary bg-primary text-primary-fg shadow-border"
      : "border-border bg-raised/60 text-muted",
    interactive && !selected && "hover:-translate-y-px hover:border-primary/50 hover:text-fg active:scale-[0.96]",
  );
  if (!interactive) {
    return (
      <div aria-hidden className={look}>
        <Plus className="size-4" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Platz ${index + 1} wählen`}
      aria-pressed={selected}
      onClick={() => onSelect?.(index)}
      data-slot={index}
      className={look}
    >
      <Plus className="size-4" strokeWidth={1.75} />
    </button>
  );
}
