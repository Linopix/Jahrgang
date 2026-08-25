import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EGG_TOTAL, noteKonamiKey, useGags } from "@/lib/gags";
import { GAG_GROUPS, GAG_ITEM_TOTAL } from "@/lib/gag-book";
import { cn } from "@/lib/utils";

export function EggTally({ className }: { className?: string }) {
  const eggs = useGags((s) => s.eggs);
  const found = useGags((s) => s.found);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("tabular-nums text-xs text-subtle transition-colors hover:text-fg", className)}
      >
        {eggs.length} / {EGG_TOTAL} gefunden
      </button>
      {open ? <EggLog found={found} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function EggLog({ found, onClose }: { found: string[]; onClose: () => void }) {
  const have = new Set(found);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-canvas/70" aria-label="Schließen" onClick={onClose} />
      <div className="relative max-h-[min(32rem,82dvh)] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-4 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Liste</p>
            <h2 className="mt-1 font-display text-2xl font-medium text-fg">Easter Eggs</h2>
            <p className="mt-1 text-xs text-muted">
              {found.length} von {GAG_ITEM_TOTAL} · Nur Gefundenes hat einen Namen.
            </p>
          </div>
          <button type="button" aria-label="Schließen" onClick={onClose} className="rounded-md p-1 text-muted hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 space-y-5">
          {GAG_GROUPS.map((group) => {
            const unlocked = group.items.some((item) => have.has(item.id));
            if (!unlocked) {
              return (
                <section key={group.id}>
                  <h3 className="text-sm font-medium text-subtle">???</h3>
                </section>
              );
            }
            return (
              <section key={group.id}>
                <h3 className="text-sm font-medium text-fg">{group.title}</h3>
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                  {group.items.map((item) => {
                    const on = have.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className={cn("truncate text-xs", on ? "text-fg" : "text-subtle")}
                      >
                        {on ? `✓ ${item.label}` : "???"}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
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
