import { useEffect, useRef, useState } from "react";
import { Palette, Volume2, VolumeX } from "lucide-react";
import {
  hydrateUiMute,
  isUiMuted,
  setUiMuted,
  sfxTick,
  subscribeUiAudio,
  unlockAudio,
} from "@/lib/game/audio";
import { THEMES, applyTheme, readTheme, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("night");
  const [uiMuted, setUiMutedState] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = readTheme();
    setTheme(id);
    applyTheme(id);
    hydrateUiMute();
    setUiMutedState(isUiMuted());
    return subscribeUiAudio(() => setUiMutedState(isUiMuted()));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
      <button
        type="button"
        aria-label="Darstellung"
        aria-expanded={open}
        onClick={() => {
          unlockAudio();
          setOpen((value) => !value);
        }}
        className="flex size-11 items-center justify-center rounded-md bg-raised text-fg shadow-border transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-px hover:bg-surface active:scale-[0.96]"
      >
        <Palette className="size-4" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-surface p-3 shadow-lift">
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Thema</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {THEMES.map((row) => {
              const active = theme === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  title={row.label}
                  aria-label={row.label}
                  aria-pressed={active}
                  onClick={() => {
                    sfxTick();
                    setTheme(row.id);
                    applyTheme(row.id);
                  }}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center gap-1 rounded-md transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px active:scale-[0.96]",
                    active ? "shadow-[0_0_0_2px_var(--color-primary)]" : "shadow-border",
                  )}
                >
                  <span
                    className="size-5 rounded-full shadow-border"
                    style={{ background: row.swatch }}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[0.65rem] tracking-[0.12em] text-subtle uppercase">
            {THEMES.find((row) => row.id === theme)?.label}
          </p>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              const next = !uiMuted;
              setUiMuted(next);
              if (!next) sfxTick();
            }}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-raised text-sm text-fg shadow-border transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-surface active:scale-[0.96]"
          >
            {uiMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {uiMuted ? "Atmosphäre aus" : "Atmosphäre an"}
          </button>
          <p className="mt-2 text-[0.7rem] leading-snug text-subtle">
            Leise Töne im Menü und Effekt-Töne. Die Songvorschau hat eine eigene
            Stummschaltung.
          </p>
        </div>
      ) : null}
    </div>
  );
}
