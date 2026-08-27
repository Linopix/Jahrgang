import { useMemo } from "react";
import { encodeQr, qrPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

const QUIET = 4;

export function QrCode({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const drawn = useMemo(() => {
    if (!value) return null;
    try {
      const matrix = encodeQr(value);
      if (!matrix || matrix.length < 21) return null;
      const d = qrPath(matrix, QUIET);
      if (!d) return null;
      return { d, box: matrix.length + QUIET * 2 };
    } catch {
      return null;
    }
  }, [value]);

  if (!drawn) {
    return (
      <div className={cn("qr-frame qr-frame-empty", className)}>
        <p className="qr-fallback">{value ? "QR nicht lesbar. Link kopieren." : "Kein Link."}</p>
      </div>
    );
  }

  return (
    <div className={cn("qr-frame", className)}>
      <svg
        xmlns="http://www.w3.org/1999/svg"
        viewBox={`0 0 ${drawn.box} ${drawn.box}`}
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
        className="qr-svg"
      >
        <title>{label}</title>
        <rect width={drawn.box} height={drawn.box} fill="#ffffff" />
        <path d={drawn.d} fill="#111111" />
      </svg>
    </div>
  );
}
