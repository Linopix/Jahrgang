import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { sfxHover, sfxTick } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export type MenuOption<T extends string> = {
  id: T;
  label: string;
  blurb?: string;
  art?: ReactNode;
};

type MenuSelectProps<T extends string> = {
  value?: T;
  items: MenuOption<T>[];
  onChange: (next: T) => void;
  placeholder?: string;
  ariaLabel: string;
  name?: string;
};

function useNarrow() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return narrow;
}

const TRIGGER =
  "flex h-14 w-full items-center gap-3 rounded-md bg-raised px-3 text-left text-fg shadow-border outline-none transition-[background-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary/70 data-[state=open]:bg-surface data-[state=open]:ring-2 data-[state=open]:ring-primary/70";

type PanelBox = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function MenuSelect<T extends string>({
  value,
  items,
  onChange,
  placeholder = "Wählen",
  ariaLabel,
  name,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox>({ left: 0, width: 320, maxHeight: 352 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const narrow = useNarrow();
  const current = items.find((item) => item.id === value);

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const below = window.innerHeight - r.bottom - gap - 12;
    const above = r.top - gap - 12;
    const openUp = below < 240 && above > below;
    const maxHeight = Math.min(22 * 16, Math.max(openUp ? above : below, 160));
    const width = Math.min(Math.max(r.width, 240), window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    setBox(
      openUp
        ? { bottom: window.innerHeight - r.top + gap, left, width, maxHeight }
        : { top: r.bottom + gap, left, width, maxHeight },
    );
  }

  function close() {
    if (!open) return;
    setOpen(false);
    sfxTick();
  }

  function openMenu() {
    place();
    setOpen(true);
    sfxTick();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const onReposition = () => place();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      html.style.overflow = prev;
    };
  }, [open]);

  const trigger = (
    <>
      {current?.art ? <span className="shrink-0">{current.art}</span> : null}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {current?.label ?? placeholder}
      </span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-muted transition-transform duration-150 ease-out",
          open && "rotate-180",
        )}
      />
    </>
  );

  const list = (
    <>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected}
            onMouseEnter={() => {
              if (!selected) sfxHover();
            }}
            onClick={() => {
              onChange(item.id);
              close();
            }}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left",
              "transition-colors duration-150",
              selected ? "bg-primary text-primary-fg" : "text-fg hover:bg-raised",
            )}
          >
            {item.art ? <span className="shrink-0">{item.art}</span> : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{item.label}</span>
              {item.blurb ? (
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-snug",
                    selected ? "text-primary-fg/80" : "text-muted",
                  )}
                >
                  {item.blurb}
                </span>
              ) : null}
            </span>
            {selected ? <Check className="size-4 shrink-0" strokeWidth={2} /> : null}
          </button>
        );
      })}
    </>
  );

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-menu={name ?? ariaLabel}
        data-state={open ? "open" : "closed"}
        className={TRIGGER}
        onClick={() => (open ? close() : openMenu())}
      >
        {trigger}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-50" role="presentation">
              <button
                type="button"
                aria-label="Schließen"
                className="dialog-overlay absolute inset-0 bg-bg/55"
                onClick={close}
              />
              <div
                role="listbox"
                aria-label={ariaLabel}
                data-menu-panel={name ?? ariaLabel}
                className={cn(
                  "absolute overflow-hidden rounded-xl bg-surface text-fg shadow-lift",
                  narrow
                    ? "menu-sheet inset-x-3 bottom-3 max-h-[min(80dvh,36rem)]"
                    : "menu-panel",
                )}
                style={
                  narrow
                    ? undefined
                    : {
                        top: box.top,
                        bottom: box.bottom,
                        left: box.left,
                        width: box.width,
                        maxHeight: box.maxHeight,
                      }
                }
              >
                <div className="flex items-center justify-between gap-3 px-3 pt-2">
                  {narrow ? (
                    <div className="mx-auto h-1 w-10 rounded-full bg-border" />
                  ) : (
                    <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
                      {ariaLabel}
                    </p>
                  )}
                  <button
                    type="button"
                    aria-label="Menü schließen"
                    onClick={close}
                    className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {narrow ? (
                  <p className="px-3 pb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">
                    {ariaLabel}
                  </p>
                ) : null}
                <div
                  className={cn(
                    "overflow-y-auto p-1.5",
                    narrow ? "max-h-[min(70dvh,32rem)] pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "",
                  )}
                  style={narrow ? undefined : { maxHeight: Math.max(box.maxHeight - 48, 120) }}
                >
                  {list}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
