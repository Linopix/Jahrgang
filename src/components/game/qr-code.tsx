import { useMemo } from "react";
import { encodeQr, qrPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

/** Module in SVG-Einheiten. Quiet Zone um die Finder-Muster. */
const QUIET = 4;
/** Pixel pro Modul im intrinsischen SVG. Ganzzahlig, damit Kanten scharf bleiben. */
const MODULE_PX = 8;

export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const matrix = useMemo(() => (value ? encodeQr(value) : []), [value]);
  const n = matrix.length;
  const d = useMemo(() => (n ? qrPath(matrix, QUIET) : ""), [matrix, n]);
  if (!n) return null;
  const box = n + QUIET * 2;
  const px = box * MODULE_PX;
  return (
    <div className={cn("qr-frame", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${box} ${box}`}
        width={px}
        height={px}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
        className="qr-svg"
      >
        <title>{label}</title>
        <rect width={box} height={box} fill="#ffffff" />
        <path d={d} fill="#111111" />
      </svg>
    </div>
  );
}
