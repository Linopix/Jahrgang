import { useEffect } from "react";
import { EGG_TOTAL, noteKonamiKey, useGags } from "@/lib/gags";
import { cn } from "@/lib/utils";

export function EggTally({ className }: { className?: string }) {
  const eggs = useGags((s) => s.eggs);
  if (eggs.length === 0) return null;
  return (
    <p className={cn("tabular-nums text-xs text-subtle", className)}>
      {eggs.length} / {EGG_TOTAL} gefunden
    </p>
  );
}

export function GagLayer() {
  const toasts = useGags((s) => s.toasts);
  const disco = useGags((s) => s.disco);
  const hydrateEggs = useGags((s) => s.hydrateEggs);

  useEffect(() => {
    hydrateEggs();
  }, [hydrateEggs]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      noteKonamiKey(event.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {disco ? <div className="disco-flash" aria-hidden="true" /> : null}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((row) => (
          <p
            key={row.id}
            className="pop-in max-w-sm rounded-md bg-surface px-3 py-2 text-center text-sm text-fg shadow-lift"
          >
            {row.text}
          </p>
        ))}
      </div>
    </>
  );
}