import { useMemo, useState } from "react";
import { suggestNames } from "@/lib/game/guess";
import { cn } from "@/lib/utils";

const FIELD =
  "h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow,background-color] duration-150 ease-out focus:ring-2 focus:ring-primary/70";

type GuessFieldProps = {
  value: string;
  onChange: (next: string) => void;
  pool: readonly string[];
  placeholder: string;
  label: string;
  showWhenEmpty?: boolean;
};

export function GuessField({ value, onChange, pool, placeholder, label, showWhenEmpty }: GuessFieldProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hints = useMemo(() => {
    if (value.trim().length < 2) return showWhenEmpty ? [...pool].slice(0, 8) : [];
    return suggestNames(value, pool);
  }, [value, pool, showWhenEmpty]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (!open || hints.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => (i + 1) % hints.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => (i - 1 + hints.length) % hints.length);
          } else if (event.key === "Enter") {
            const choice = hints[active];
            if (choice) {
              event.preventDefault();
              pick(choice);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        data-guess={label}
        className={FIELD}
        placeholder={placeholder}
        maxLength={80}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={open && hints.length > 0}
        aria-autocomplete="list"
      />
      {open && hints.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md bg-surface py-1 shadow-lift">
          {hints.map((hint, index) => (
            <li key={hint}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(hint)}
                className={cn(
                  "flex h-11 w-full items-center px-4 text-left text-sm text-fg",
                  index === active ? "bg-raised" : "hover:bg-raised",
                )}
              >
                {hint}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
