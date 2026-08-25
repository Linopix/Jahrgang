import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { peekPlaylist } from "@/lib/game/playlist";
import {
  DECADE_OPTIONS,
  ERA_BLURBS,
  ERA_LABELS,
  GENRE_LABELS,
  PACK_GROUPS,
  TARGET_OPTIONS,
  TOKEN_OPTIONS,
  VARIANT_BLURBS,
  VARIANT_LABELS,
  decadeLabelYear,
  type GenreId,
  type PlayVariant,
  type RoomConfig,
  type TokenCount,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

const VARIANTS: PlayVariant[] = ["timeline", "original"];
const GENRES: GenreId[] = ["all", "pop", "rock", "rap", "dance", "german"];

type GameOptionsProps = {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
};

function Choice<T extends string | number>({
  items,
  value,
  onChange,
  label,
  columns,
}: {
  items: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (item: T) => string;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-2", columns ?? "grid-cols-3")}>
      {items.map((item) => (
        <button
          key={String(item)}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "h-12 rounded-md px-2 text-sm font-medium transition-colors",
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

function PlaylistField({
  value,
  onChange,
}: {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
}) {
  const [draft, setDraft] = useState(value.playlistUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value.playlistUrl);
  }, [value.playlistUrl]);

  async function apply() {
    const url = draft.trim();
    if (!url) {
      setError(null);
      onChange({ playlistUrl: "", playlistLabel: "" });
      return;
    }
    setPending(true);
    setError(null);
    const result = await peekPlaylist({ data: { url } });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange({
      era: "playlist",
      playlistUrl: result.peek.url,
      playlistLabel: `${result.peek.title} · ${result.peek.count} Titel`,
    });
  }

  return (
    <div className="mt-3 rounded-xl bg-raised p-4 shadow-border" data-playlist-field>
      <p className="text-sm text-muted">
        Öffentlichen Link einfügen. Fehlt ein Jahr, rückt der Katalog nach.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://open.spotify.com/playlist/…"
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 rounded-md bg-surface px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] placeholder:text-subtle focus:ring-2 focus:ring-primary/70"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void apply();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-12 shrink-0"
          disabled={pending}
          onClick={() => void apply()}
        >
          {pending ? "Prüfen…" : draft.trim() ? "Übernehmen" : "Leeren"}
        </Button>
      </div>
      {value.playlistLabel ? <p className="mt-2 text-sm text-fg">{value.playlistLabel}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function MixField({
  value,
  onChange,
}: {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
}) {
  return (
    <div className="mt-3 space-y-4 rounded-xl bg-raised p-4 shadow-border" data-mix-field>
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Von</p>
        <div className="mt-2">
          <Choice
            items={DECADE_OPTIONS}
            value={value.mixFrom as (typeof DECADE_OPTIONS)[number]}
            onChange={(mixFrom) => onChange({ era: "mix", mixFrom })}
            label={decadeLabelYear}
            columns="grid-cols-4 sm:grid-cols-7"
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Bis</p>
        <div className="mt-2">
          <Choice
            items={DECADE_OPTIONS}
            value={value.mixTo as (typeof DECADE_OPTIONS)[number]}
            onChange={(mixTo) => onChange({ era: "mix", mixTo })}
            label={decadeLabelYear}
            columns="grid-cols-4 sm:grid-cols-7"
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Genre</p>
        <div className="mt-2">
          <Choice
            items={GENRES}
            value={value.mixGenre}
            onChange={(mixGenre) => onChange({ era: "mix", mixGenre })}
            label={(item) => GENRE_LABELS[item]}
            columns="grid-cols-3 sm:grid-cols-6"
          />
        </div>
      </div>
    </div>
  );
}

export function GameOptions({ value, onChange }: GameOptionsProps) {
  return (
    <div>
      <div className="mt-8 grid gap-8 lg:mt-0 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium text-fg">Spiel</h2>
          <div className="mt-3">
            <Choice
              items={VARIANTS}
              value={value.variant}
              onChange={(variant) => onChange({ variant })}
              label={(item) => VARIANT_LABELS[item]}
              columns="grid-cols-2"
            />
          </div>
          <p className="mt-2 text-sm text-muted">{VARIANT_BLURBS[value.variant]}</p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-fg">Ziel und Joker</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Choice
              items={TARGET_OPTIONS}
              value={value.target}
              onChange={(target) => onChange({ target })}
              label={(item) => `${item}`}
            />
            <Choice
              items={TOKEN_OPTIONS}
              value={value.tokens}
              onChange={(tokens) => onChange({ tokens: tokens as TokenCount })}
              label={(item) => (item === 0 ? "Keine" : String(item))}
            />
          </div>
          <p className="mt-2 text-sm text-muted">Karten bis zum Sieg · Joker pro Person.</p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-fg">Repertoire</h2>
        <p className="mt-1 text-sm text-muted">{ERA_BLURBS[value.era]}</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {PACK_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
                {group.title}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.ids.map((id) => (
                  <button
                    key={id}
                    type="button"
                    data-pack={id}
                    onClick={() => onChange({ era: id })}
                    className={cn(
                      "h-12 rounded-md px-3 text-sm font-medium transition-colors",
                      value.era === id
                        ? "bg-primary text-primary-fg"
                        : "bg-raised text-fg shadow-border hover:bg-surface",
                    )}
                  >
                    {ERA_LABELS[id]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {value.era === "playlist" ? <PlaylistField value={value} onChange={onChange} /> : null}
        {value.era === "mix" ? <MixField value={value} onChange={onChange} /> : null}
      </section>
    </div>
  );
}

export function roomConfigSummary(config: RoomConfig) {
  const joker = config.tokens === 0 ? "ohne Joker" : `${config.tokens} Joker`;
  if (config.era === "playlist" && config.playlistLabel) {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${config.playlistLabel}`;
  }
  if (config.era === "mix") {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · Mix ${decadeLabelYear(config.mixFrom)}–${decadeLabelYear(config.mixTo)} · ${GENRE_LABELS[config.mixGenre]}`;
  }
  return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${ERA_LABELS[config.era]}`;
}
