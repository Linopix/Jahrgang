import type { EraId, GenreId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const PACK_INK: Record<EraId, { a: string; b: string; c: string; mark: string }> = {
  all: { a: "#1c1814", b: "#d8c4a0", c: "#8a7058", mark: "ALL" },
  classic: { a: "#2a1c12", b: "#c4a060", c: "#6a4828", mark: "70" },
  eighties: { a: "#2a0830", b: "#ff3dac", c: "#22e0ff", mark: "80" },
  nineties: { a: "#101820", b: "#f0c040", c: "#e04828", mark: "90" },
  "two-thousands": { a: "#142028", b: "#40c8f0", c: "#f078b4", mark: "00" },
  tens: { a: "#101418", b: "#e8e0d4", c: "#c45c4a", mark: "10" },
  today: { a: "#0c1018", b: "#7ec8ff", c: "#b48cff", mark: "20" },
  german: { a: "#1a1410", b: "#d0c4a8", c: "#c45c4a", mark: "DE" },
  pop: { a: "#241018", b: "#f090b8", c: "#f0d080", mark: "POP" },
  rock: { a: "#140c0c", b: "#c04030", c: "#d8c8b0", mark: "RCK" },
  rap: { a: "#10100c", b: "#e0b050", c: "#303028", mark: "RAP" },
  dance: { a: "#0c1428", b: "#40e0d0", c: "#d060ff", mark: "DNC" },
  party: { a: "#201008", b: "#f0a020", c: "#e04060", mark: "GO" },
  charts: { a: "#101820", b: "#50d090", c: "#f0e080", mark: "№1" },
  "rap-charts": { a: "#14100c", b: "#e8c060", c: "#48a0e0", mark: "HH" },
  mix: { a: "#181410", b: "#d8b898", c: "#7090a8", mark: "MIX" },
  playlist: { a: "#12161c", b: "#a8d0a0", c: "#d8c8a8", mark: "LIST" },
};

const GENRE_INK: Record<GenreId, { a: string; b: string; c: string; mark: string }> = {
  all: PACK_INK.all,
  pop: PACK_INK.pop,
  rock: PACK_INK.rock,
  rap: PACK_INK.rap,
  dance: PACK_INK.dance,
  german: PACK_INK.german,
};

function Sleeve({
  a,
  b,
  c,
  mark,
  className,
}: {
  a: string;
  b: string;
  c: string;
  mark: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={cn("shrink-0 rounded-sm shadow-border", className ?? "size-7 pack-art-in")}
      aria-hidden="true"
    >
      <rect width="80" height="80" fill={a} />
      <rect x="0" y="0" width="6" height="80" fill={c} opacity="0.7" />
      <rect x="8" y="8" width="64" height="64" fill={b} />
      <circle cx="40" cy="38" r="24" fill={a} />
      <circle cx="40" cy="38" r="21.5" fill={c} opacity="0.92" />
      <circle cx="40" cy="38" r="18" fill="none" stroke={a} strokeWidth="0.7" opacity="0.4" />
      <circle cx="40" cy="38" r="14" fill="none" stroke={a} strokeWidth="0.7" opacity="0.35" />
      <circle cx="40" cy="38" r="9" fill="none" stroke={a} strokeWidth="0.7" opacity="0.3" />
      <circle cx="40" cy="38" r="5.5" fill={a} />
      <circle cx="40" cy="38" r="2" fill={b} />
      <text
        x="40"
        y="73"
        textAnchor="middle"
        fill={a}
        fontSize="9"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
      >
        {mark}
      </text>
    </svg>
  );
}

export function PackArt({ id, className }: { id: EraId; className?: string }) {
  const ink = PACK_INK[id];
  return <Sleeve {...ink} className={className} />;
}

export function GenreArt({ id, className }: { id: GenreId; className?: string }) {
  const ink = GENRE_INK[id];
  return <Sleeve {...ink} className={className} />;
}
