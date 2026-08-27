import { sfxTick } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

type SwitchRowProps = {
  label: string;
  hint: string;
  on: boolean;
  onChange: (next: boolean) => void;
  className?: string;
};

export function SwitchRow({ label, hint, on, onChange, className }: SwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        onChange(!on);
        sfxTick();
      }}
      className={cn("flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left", className)}
    >
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors duration-200 ease-soft motion-reduce:transition-none",
          on ? "bg-primary" : "bg-surface shadow-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full transition-transform duration-200 ease-soft motion-reduce:transition-none",
            on ? "translate-x-4 bg-primary-fg" : "bg-fg",
          )}
        />
      </span>
    </button>
  );
}

export const SWITCH_PANEL =
  "divide-y divide-border rounded-xl bg-raised px-4 py-1 shadow-border";
