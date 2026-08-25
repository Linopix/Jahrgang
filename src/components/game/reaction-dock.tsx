import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { REACTION_EMOJIS, sendReaction, useReactions } from "@/lib/game/reactions";
import { useOnline } from "@/lib/game/online-store";
import { sfxHover, unlockAudio } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function ReactionDock() {
  const status = useOnline((s) => s.status);
  const enabled = useOnline((s) => s.emoji);
  const bursts = useReactions((s) => s.bursts);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const live = status === "lobby" || status === "playing" || status === "connecting";

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

  if (!live || !enabled) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
        {bursts.map((burst) => (
          <span
            key={burst.id}
            className="react-burst absolute bottom-24 flex flex-col items-center"
            style={{ left: `${burst.x}%` }}
          >
            <span className="text-3xl leading-none drop-shadow-sm sm:text-4xl">{burst.emoji}</span>
            {burst.name ? (
              <span className="mt-1 max-w-24 truncate text-[0.65rem] text-fg/80">{burst.name}</span>
            ) : null}
          </span>
        ))}
      </div>
      <div
        ref={root}
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-40 sm:left-4"
      >
        {open ? (
          <div className="mb-2 grid grid-cols-4 gap-1 rounded-xl bg-surface p-1.5 shadow-lift">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Reaktion ${emoji}`}
                onMouseEnter={() => sfxHover()}
                onClick={() => {
                  unlockAudio();
                  sendReaction(emoji);
                }}
                className="flex size-11 items-center justify-center rounded-md text-xl transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-raised active:scale-[0.94]"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          aria-label="Reaktion senden"
          aria-expanded={open}
          onClick={() => {
            unlockAudio();
            setOpen((value) => !value);
          }}
          className={cn(
            "flex size-11 items-center justify-center rounded-md bg-raised text-fg shadow-border transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-surface active:scale-[0.96]",
            open && "bg-primary text-primary-fg",
          )}
        >
          <Smile className="size-4" />
        </button>
      </div>
    </>
  );
}
