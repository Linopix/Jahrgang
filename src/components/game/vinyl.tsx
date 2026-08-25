import { noteVinylClick, noteVinylLabel } from "@/lib/gags";
import { cn } from "@/lib/utils";

type VinylProps = {
  spinning?: boolean;
  slow?: boolean;
  reverse?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  artworkUrl?: string;
};

const sizes = {
  sm: "size-24",
  md: "size-36 sm:size-52 lg:size-64",
  lg: "size-56 sm:size-72",
};

export function Vinyl({
  spinning,
  slow,
  reverse,
  size = "md",
  label = "JAHRGANG",
  artworkUrl,
}: VinylProps) {
  return (
    <div className={cn("relative", sizes[size])} onClick={noteVinylClick}>
      <div
        className={cn(
          "vinyl-disc size-full rounded-full",
          spinning && "is-playing",
          slow && "is-slow",
          reverse && "is-reverse",
        )}
      >
        <button
          type="button"
          aria-label="Plattenmitte"
          className="vinyl-label z-10 cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            noteVinylLabel();
          }}
        >
          {artworkUrl ? (
            <img src={artworkUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center px-2 text-center">
              <span className="font-display text-[0.65rem] font-medium tracking-[0.18em] text-card-fg uppercase">
                {label}
              </span>
            </div>
          )}
        </button>
      </div>
      <div className="vinyl-sheen" />
    </div>
  );
}
