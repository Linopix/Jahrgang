import {
  ERA_LABELS,
  TARGET_OPTIONS,
  TOKEN_OPTIONS,
  VARIANT_BLURBS,
  VARIANT_LABELS,
  type EraId,
  type PlayVariant,
  type RoomConfig,
  type TokenCount,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

const ERAS = Object.keys(ERA_LABELS) as EraId[];
const VARIANTS: PlayVariant[] = ["timeline", "original"];

type GameOptionsProps = {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
};

function Choice<T extends string | number>({
  items,
  value,
  onChange,
  label,
  wide,
}: {
  items: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (item: T) => string;
  wide?: boolean;
}) {
  return (
    <div className={cn("grid gap-2", wide ? "grid-cols-2" : "grid-cols-3")}>
      {items.map((item) => (
        <button
          key={String(item)}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "h-12 rounded-md text-sm font-medium transition-colors",
            value === item
              ? "bg-primary text-primary-fg"
              : "bg-raised text-fg shadow-border hover:bg-surface",
          )}
        >
          {label(item)}
        </button>
      ))}
    </div>
  );
}

export function GameOptions({ value, onChange }: GameOptionsProps) {
  return (
    <>
      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Spiel</h2>
        <div className="mt-3">
          <Choice
            items={VARIANTS}
            value={value.variant}
            onChange={(variant) => onChange({ variant })}
            label={(item) => VARIANT_LABELS[item]}
            wide
          />
        </div>
        <p className="mt-2 text-sm text-muted">{VARIANT_BLURBS[value.variant]}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Ziel</h2>
        <div className="mt-3">
          <Choice
            items={TARGET_OPTIONS}
            value={value.target}
            onChange={(target) => onChange({ target })}
            label={(item) => `${item} Karten`}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Joker</h2>
        <div className="mt-3">
          <Choice
            items={TOKEN_OPTIONS}
            value={value.tokens}
            onChange={(tokens) => onChange({ tokens: tokens as TokenCount })}
            label={(item) => (item === 0 ? "Keine" : String(item))}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Repertoire</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ERAS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ era: id })}
              className={cn(
                "h-10 rounded-full px-3.5 text-sm transition-colors",
                value.era === id
                  ? "bg-primary text-primary-fg"
                  : "bg-raised text-muted shadow-border hover:text-fg",
              )}
            >
              {ERA_LABELS[id]}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export function roomConfigSummary(config: RoomConfig) {
  const joker =
    config.tokens === 0 ? "ohne Joker" : `${config.tokens} Joker`;
  return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${ERA_LABELS[config.era]}`;
}
