import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Smile } from "lucide-react";
import { EMOTE_SRC, HIDDEN_EMOTES, REACTION_EMOJIS, sendReaction, useReactions } from "@/lib/game/reactions";
import { useOnline } from "@/lib/game/online-store";
import { sfxHover, unlockAudio } from "@/lib/game/audio";
import { useGags } from "@/lib/gags";
import { EmoteMark } from "./emote";
import { cn } from "@/lib/utils";

export function ReactionDock() {
  const status = useOnline((s) => s.status);
  const enabled = useOnline((s) => s.emoji);
  const bursts = useReactions((s) => s.bursts);
  const found = useGags((s) => s.found);
  const hint = useGags((s) => s.hintEmote);
  const setHintEmote = useGags((s) => s.setHintEmote);
  const extra = HIDDEN_EMOTES.filter((id) => found.includes(id));
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const live = status === "lobby" || status === "playing" || status === "connecting";

  useEffect(() => {
    if (hint) setOpen(true);
  }, [hint]);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHintEmote(false), 8000);
    return () => window.clearTimeout(timer);
  }, [hint, setHintEmote]);

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
            <span className="text-3xl leading-none drop-shadow-sm sm:text-4xl">
              <EmoteMark id={burst.emoji} className="size-10 sm:size-12" />
            </span>
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
          <div className="pop-in mb-2 grid grid-cols-4 gap-1 rounded-xl bg-surface p-1.5 shadow-lift">
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
                className="flex size-11 items-center justify-center rounded-md text-xl transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-raised active:scale-[0.96]"
              >
                {emoji}
              </button>
            ))}
            {extra.map((id) => (
              <button
                key={id}
                type="button"
                aria-label="Reaktion Schweinebein"
                onMouseEnter={() => sfxHover()}
                onClick={() => {
                  unlockAudio();
                  setHintEmote(false);
                  sendReaction(id);
                }}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-md transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-raised active:scale-[0.96]",
                  hint && "ring-2 ring-primary",
                )}
              >
                <img src={EMOTE_SRC[id]} alt="" className="size-8 rounded-sm object-cover" />
                {hint ? (
                  <span className="pointer-events-none absolute top-1/2 left-full z-10 ml-2 flex -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-surface px-2 py-1 text-xs text-fg shadow-lift">
                    <ArrowLeft className="size-3.5" />
                    schau da
                  </span>
                ) : null}
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
