import { cn } from "@/lib/utils";

type VinylProps = {
  spinning?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  artworkUrl?: string;
};

const sizes = {
  sm: "size-24",
  md: "size-36 sm:size-52",
  lg: "size-56 sm:size-72",
};

export function Vinyl({ spinning, size = "md", label = "JAHRGANG", artworkUrl }: VinylProps) {
  return (
    <div className={cn("relative", sizes[size])} aria-hidden="true">
      <div
        className={cn(
          "vinyl-disc size-full rounded-full",
          spinning && "vinyl-spin",
        )}
      />
      <div className="pointer-events-none absolute inset-[28%] overflow-hidden rounded-full bg-card">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-2 text-center">
            <span className="font-display text-[0.65rem] font-medium tracking-[0.18em] text-card-fg uppercase">
              {label}
            </span>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgb(0_0_0_/_0.35)]" />
    </div>
  );
}
