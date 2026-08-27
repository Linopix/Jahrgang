import { useEffect, useRef, useState } from "react";
import { Palette, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hydrateUiMute,
  isUiMuted,
  setDiscoAudio,
  setRetroAudio,
  setUiMuted,
  sfxTick,
  subscribeUiAudio,
  unlockAudio,
} from "@/lib/game/audio";
import { THEMES, applyTheme, readTheme, visibleThemes, type ThemeId } from "@/lib/theme";
import { notePaperSign } from "@/lib/gags";
import { EggTally } from "@/components/game/gag-layer";
import { cn } from "@/lib/utils";

function SignaturePad({ onInk }: { onInk: (enough: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const ink = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const next = point(event);
    if (!ctx || !last.current) {
      last.current = next;
      return;
    }
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    ink.current += Math.hypot(next.x - last.current.x, next.y - last.current.y);
    last.current = next;
    onInk(ink.current > 90);
  }

  return (
    <canvas
      ref={canvasRef}
      className="mt-3 h-24 w-full cursor-crosshair touch-none rounded-md bg-raised text-fg shadow-border"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = true;
        last.current = point(event);
      }}
      onPointerMove={move}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
}

export function openAppearance() {
  window.dispatchEvent(new Event("jahrgang-appearance"));
}

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("night");
  const [uiMuted, setUiMutedState] = useState(false);
  const [paperWarn, setPaperWarn] = useState(false);
  const [signed, setSigned] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const [palette, setPalette] = useState(() =>
    typeof window === "undefined" ? THEMES.filter((row) => !row.secret) : visibleThemes(),
  );

  function commit(id: ThemeId) {
    setTheme(id);
    applyTheme(id);
    setRetroAudio(id === "retro");
    setDiscoAudio(id === "disco");
    setPalette(visibleThemes());
  }

  useEffect(() => {
    const id = readTheme();
    commit(id);
    hydrateUiMute();
    setUiMutedState(isUiMuted());
    const sync = () => {
      setTheme(readTheme());
      setPalette(visibleThemes());
      setRetroAudio(readTheme() === "retro");
      setDiscoAudio(readTheme() === "disco");
    };
    window.addEventListener("jahrgang-theme", sync);
    const openPanel = () => setOpen(true);
    window.addEventListener("jahrgang-appearance", openPanel);
    const unsub = subscribeUiAudio(() => setUiMutedState(isUiMuted()));
    return () => {
      window.removeEventListener("jahrgang-theme", sync);
      window.removeEventListener("jahrgang-appearance", openPanel);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (paperWarn) return;
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (paperWarn) {
          setPaperWarn(false);
          setSigned(false);
        } else setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, paperWarn]);

  function pick(id: ThemeId) {
    sfxTick();
    if (id === "paper" && theme !== "paper") {
      setSigned(false);
      setPaperWarn(true);
      return;
    }
    commit(id);
  }

  function acceptPaper() {
    if (!signed) return;
    sfxTick();
    commit("paper");
    setPaperWarn(false);
    notePaperSign();
  }

  return (
    <div ref={root} className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
      <button
        type="button"
        aria-label="Einstellungen"
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
          <div className="mt-2 grid grid-cols-3 gap-2">
            {palette.map((row) => {
              const active = theme === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  title={row.label}
                  aria-label={row.label}
                  aria-pressed={active}
                  onClick={() => pick(row.id)}
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
          {theme === "paper" ? (
            <p className="mt-2 text-[0.7rem] leading-snug text-subtle">
              Papier-Modus. Netzhaut auf eigene Gefahr.
            </p>
          ) : null}
          {theme === "disco" ? (
            <p className="mt-2 text-[0.7rem] leading-snug text-subtle">
              Cheat-Modus. Konami lässt grüßen.
            </p>
          ) : null}
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
          <EggTally className="mt-2 text-center" />
        </div>
      ) : null}
      {paperWarn ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Abbrechen"
            className="dialog-overlay absolute inset-0 bg-bg/70"
            onClick={() => {
              setPaperWarn(false);
              setSigned(false);
            }}
          />
          <div
            role="dialog"
            aria-labelledby="paper-warn-title"
            className="dialog-panel relative w-full max-w-sm rounded-xl bg-surface p-5 shadow-lift"
          >
            <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
              Auf eigene Gefahr
            </p>
            <h2 id="paper-warn-title" className="mt-2 font-display text-2xl font-medium text-fg">
              Wirklich Papier?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Das Theme ist so hell, dass die Netzhaut eventuell kündigt. Blendung,
              Tränen und der Wunsch, sofort wieder auf Nacht umzuschalten: alles
              selbst schuld. Jahrgang haftet nicht für verbrannte Augen.
            </p>
            <p className="mt-4 text-xs font-medium tracking-[0.16em] text-muted uppercase">
              Unterschrift der geblendeten Person
            </p>
            <SignaturePad onInk={setSigned} />
            <p className="mt-1 text-[0.7rem] text-subtle">
              {signed ? "Gilt als Einverständnis." : "Bitte unterschreiben. Ein Punkt zählt nicht."}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPaperWarn(false);
                  setSigned(false);
                }}
              >
                Lieber dunkel
              </Button>
              <Button disabled={!signed} onClick={acceptPaper}>
                Augen zu und durch
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
