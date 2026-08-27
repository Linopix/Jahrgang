import { useMemo } from "react";
import { encodeQr, qrPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

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
  if (!n) return null;
  const pad = 3;
  const box = n + pad * 2;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${box} ${box}`}
      role="img"
      aria-label={label}
      className={cn("rounded-lg bg-surface text-fg shadow-lift", className)}
    >
      <path d={qrPath(matrix)} fill="currentColor" />
    </svg>
  );
}
