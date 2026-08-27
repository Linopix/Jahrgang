import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { CHAT_MAX, sendChat, useChat } from "@/lib/game/chat";
import { useOnline } from "@/lib/game/online-store";
import { unlockAudio } from "@/lib/game/audio";
import { EmoteMark } from "./emote";
import { cn } from "@/lib/utils";

export function ChatDock() {
  const status = useOnline((s) => s.status);
  const enabled = useOnline((s) => s.chat);
  const lines = useChat((s) => s.lines);
  const unread = useChat((s) => s.unread);
  const open = useChat((s) => s.open);
  const setOpen = useChat((s) => s.setOpen);
  const reset = useChat((s) => s.reset);
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const live = status === "lobby" || status === "playing" || status === "connecting";

  useEffect(() => {
    if (!live) reset();
  }, [live, reset]);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines, open]);

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
  }, [open, setOpen]);

  if (!live || !enabled) return null;

  return (
    <div
      ref={root}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 sm:right-4"
    >
      {open ? (
        <div className="pop-in mb-2 flex h-72 w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl bg-surface shadow-lift">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Chat</p>
          </div>
          <div ref={list} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-1">
            {lines.length === 0 ? (
              <p className="pt-6 text-center text-xs text-subtle">Noch leer.</p>
            ) : (
              lines.map((line) => (
                <p key={line.id} className="text-sm leading-snug">
                  {line.name ? (
                    <>
                      <span className={cn("font-medium", line.self ? "text-primary" : "text-fg")}>
                        {line.name}
                      </span>
                      <span className="text-muted"> · </span>
                    </>
                  ) : null}
                  <span className="text-fg">
                    {line.text.replace(/\s+/g, "").toLowerCase() === "schweinebein" ? (
                      <EmoteMark id="schweinebein" className="size-6 align-text-bottom" />
                    ) : (
                      line.text
                    )}
                  </span>
                </p>
              ))
            )}
          </div>
          <form
            className="border-t border-border p-2"
            onSubmit={(event) => {
              event.preventDefault();
              unlockAudio();
              if (sendChat(draft)) setDraft("");
            }}
          >
            <input
              value={draft}
              maxLength={CHAT_MAX}
              placeholder="Nachricht"
              aria-label="Nachricht"
              onChange={(event) => setDraft(event.target.value)}
              className="h-10 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-border outline-none transition-[box-shadow] duration-150 ease-out focus:ring-2 focus:ring-primary/70"
            />
          </form>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Chat"
        aria-expanded={open}
        className={cn(
          "relative ml-auto flex size-11 items-center justify-center rounded-md bg-raised text-fg shadow-border transition-[transform,background-color] duration-150 ease-out hover:-translate-y-px hover:bg-surface active:scale-[0.96]",
          open && "bg-primary text-primary-fg",
        )}
        onClick={() => {
          unlockAudio();
          setOpen(!open);
        }}
      >
        <MessageCircle className="size-4" />
        {unread > 0 && !open ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-medium text-primary-fg">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
    </div>
  );
}
