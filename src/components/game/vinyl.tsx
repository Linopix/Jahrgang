import { noteVinylClick } from "@/lib/gags";
import { cn } from "@/lib/utils";

type VinylProps = {
  spinning?: boolean;
  slow?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  artworkUrl?: string;
};

const sizes = {
  sm: "size-24",
  md: "size-36 sm:size-52",
  lg: "size-56 sm:size-72",
};

export function Vinyl({
  spinning,
  slow,
  size = "md",
  label = "JAHRGANG",
  artworkUrl,
}: VinylProps) {
  return (
    <div className={cn("relative", sizes[size])} aria-hidden="true" onClick={noteVinylClick}>
      <div
        className={cn(
          "vinyl-disc size-full rounded-full",
          spinning && "is-playing",
          slow && "is-slow",
        )}
      >
        <div className="vinyl-label">
          {artworkUrl ? (
            <img src={artworkUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center px-2 text-center">
              <span className="font-display text-[0.65rem] font-medium tracking-[0.18em] text-card-fg uppercase">
                {label}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="vinyl-sheen" />
    </div>
  );
}
