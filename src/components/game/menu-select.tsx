import { useEffect, useState, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
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

export function MenuSelect<T extends string>({
  value,
  items,
  onChange,
  placeholder = "Wählen",
  ariaLabel,
  name,
}: MenuSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const narrow = useNarrow();
  const current = items.find((item) => item.id === value);

  function toggle(next: boolean) {
    setOpen(next);
    sfxTick();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") toggle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  if (narrow) {
    return (
      <div>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          data-menu={name ?? ariaLabel}
          data-state={open ? "open" : "closed"}
          className={TRIGGER}
          onClick={() => toggle(!open)}
        >
          {trigger}
        </button>
        {open ? (
          <div className="fixed inset-0 z-50" role="presentation">
            <button
              type="button"
              aria-label="Schließen"
              className="dialog-overlay absolute inset-0 bg-bg/70"
              onClick={() => toggle(false)}
            />
            <div
              role="listbox"
              aria-label={ariaLabel}
              data-menu-panel={name ?? ariaLabel}
              className="menu-sheet absolute inset-x-3 bottom-3 max-h-[min(80vh,36rem)] overflow-y-auto rounded-xl bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-fg shadow-lift"
            >
              <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border" />
              <p className="px-3 pb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">
                {ariaLabel}
              </p>
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
                      toggle(false);
                    }}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left",
                      "transition-colors duration-150",
                      selected
                        ? "bg-primary text-primary-fg"
                        : "text-fg hover:bg-raised",
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
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Select.Root
      value={value}
      open={open}
      onOpenChange={toggle}
      onValueChange={(next) => onChange(next as T)}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        data-menu={name ?? ariaLabel}
        className={TRIGGER}
      >
        {trigger}
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="menu-panel z-50 overflow-hidden rounded-lg bg-surface text-fg shadow-lift"
        >
          <Select.Viewport className="max-h-[min(22rem,70vh)] overflow-y-auto p-1.5">
            {items.map((item) => (
              <Select.Item
                key={item.id}
                value={item.id}
                onMouseEnter={() => {
                  if (item.id !== value) sfxHover();
                }}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 outline-none",
                  "transition-colors duration-150",
                  "data-[highlighted]:not-data-[state=checked]:bg-raised",
                  "data-[state=checked]:bg-primary data-[state=checked]:text-primary-fg",
                )}
              >
                {item.art ? <span className="shrink-0">{item.art}</span> : null}
                <span className="min-w-0 flex-1">
                  <Select.ItemText>
                    <span className="block text-sm font-medium">{item.label}</span>
                  </Select.ItemText>
                  {item.blurb ? (
                    <span className="mt-0.5 block text-xs leading-snug text-muted group-data-[state=checked]:text-primary-fg/80">
                      {item.blurb}
                    </span>
                  ) : null}
                </span>
                <Select.ItemIndicator className="shrink-0">
                  <Check className="size-4" strokeWidth={2} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
