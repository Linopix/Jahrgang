import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { peekPlaylist } from "@/lib/game/playlist";
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
      playlistUrl: result.peek.url,
      playlistLabel: `${result.peek.title} · ${result.peek.count} Titel`,
    });
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-fg">Playlist</h2>
      <p className="mt-1 text-sm text-muted">
        Optional. Öffentlicher Spotify- oder Deezer-Link. Fehlt ein Jahr, rückt das Repertoire nach.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://open.spotify.com/playlist/…"
          autoComplete="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] placeholder:text-subtle focus:ring-2 focus:ring-primary/70"
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
      {value.playlistLabel ? (
        <p className="mt-2 text-sm text-fg">{value.playlistLabel}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </section>
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

      <PlaylistField value={value} onChange={onChange} />
    </>
  );
}

export function roomConfigSummary(config: RoomConfig) {
  const joker =
    config.tokens === 0 ? "ohne Joker" : `${config.tokens} Joker`;
  const playlist = config.playlistLabel ? ` · ${config.playlistLabel}` : "";
  return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${ERA_LABELS[config.era]}${playlist}`;
}
