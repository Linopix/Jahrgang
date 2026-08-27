import { sfxHover, sfxTick } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

type SegmentProps<T extends string | number> = {
  items: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (item: T) => string;
};

export function Segment<T extends string | number>({ items, value, onChange, label }: SegmentProps<T>) {
  const index = Math.max(0, items.indexOf(value));
  const count = items.length;
  return (
    <div className="relative flex rounded-md bg-raised p-0.5 shadow-border" role="group">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-sm bg-primary transition-transform duration-200 ease-soft motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.25rem) / ${count})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {items.map((item) => {
        const on = item === value;
        return (
          <button
            key={String(item)}
            type="button"
            onMouseEnter={() => {
              if (!on) sfxHover();
            }}
            onClick={() => {
              if (!on) sfxTick();
              onChange(item);
            }}
            className={cn(
              "relative z-10 h-11 min-w-0 flex-1 truncate rounded-sm px-2 text-xs font-medium transition-colors duration-200 ease-soft motion-reduce:transition-none",
              on ? "text-primary-fg" : "text-muted hover:text-fg",
            )}
          >
            {label(item)}
          </button>
        );
      })}
    </div>
  );
}
