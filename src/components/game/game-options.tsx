import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { peekPlaylist } from "@/lib/game/playlist";
import { sfxHover, sfxSlide, sfxTick } from "@/lib/game/audio";
import { GenreArt, PackArt } from "@/components/game/pack-art";
import { noteMixYears } from "@/lib/gags";
import {
  ERA_BLURBS,
  ERA_LABELS,
  GENRE_LABELS,
  NEXT_ROUND_BLURB,
  NEXT_ROUND_LABELS,
  NEXT_ROUND_OPTIONS,
  PACK_GROUPS,
  VARIANT_BLURBS,
  VARIANT_LABELS,
  YEAR_MAX,
  YEAR_MIN,
  type GenreId,
  type NextRoundPolicy,
  type PlayVariant,
  type RoomConfig,
  type TokenCount,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

const VARIANTS: PlayVariant[] = ["timeline", "blind", "original", "star", "hook", "wild"];
const GENRES: GenreId[] = ["all", "pop", "rock", "rap", "dance", "german"];

type GameOptionsProps = {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
  online?: boolean;
};

const CHIP =
  "flex h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px active:scale-[0.96]";

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
          onMouseEnter={() => {
            if (item !== value) sfxHover();
          }}
          onClick={() => {
            if (item !== value) sfxTick();
            onChange(item);
          }}
          className={cn(
            CHIP,
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
        Öffentlichen Spotify- oder Deezer-Link einfügen, oder Zeilen: Interpret – Titel.
      </p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="https://open.spotify.com/playlist/…"
        autoComplete="off"
        spellCheck={false}
        rows={4}
        className="mt-3 w-full rounded-md bg-surface px-4 py-3 text-sm text-fg shadow-border outline-none transition-[box-shadow] placeholder:text-subtle focus:ring-2 focus:ring-primary/70"
      />
      <div className="mt-2 flex justify-end">
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

const SELECT =
  "h-12 w-full appearance-none rounded-md bg-surface px-4 pr-10 text-sm text-fg shadow-border outline-none transition-[box-shadow] focus:ring-2 focus:ring-primary/70";

function SnapSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm tabular-nums text-fg">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (next !== value) sfxTick();
          onChange(next);
        }}
        className="range-single mt-2 w-full"
      />
    </label>
  );
}

function DualYearSlider({
  from,
  to,
  onChange,
}: {
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const span = YEAR_MAX - YEAR_MIN;
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const left = ((start - YEAR_MIN) / span) * 100;
  const right = ((end - YEAR_MIN) / span) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="tabular-nums text-fg">{start}</span>
        <span className="text-muted">Zeitraum</span>
        <span className="tabular-nums text-fg">{end}</span>
      </div>
      <div className="range-dual mt-2">
        <div className="range-dual-track" aria-hidden="true">
          <div
            className="range-dual-fill"
            style={{ left: `${left}%`, width: `${Math.max(right - left, 0)}%` }}
          />
        </div>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={start}
          aria-label="Von Jahr"
          onChange={(event) => {
            const next = Number(event.target.value);
            sfxSlide(next);
            onChange(Math.min(next, end), end);
            noteMixYears(Math.min(next, end), end);
          }}
        />
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={end}
          aria-label="Bis Jahr"
          onChange={(event) => {
            const next = Number(event.target.value);
            sfxSlide(next);
            onChange(start, Math.max(next, start));
            noteMixYears(start, Math.max(next, start));
          }}
        />
      </div>
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
      <div className="pack-sleeve is-open">
        <div className="pack-sleeve-inner">
          <GenreArt id={value.mixGenre} className="pack-cover mx-auto mb-3" />
        </div>
      </div>
      <DualYearSlider
        from={value.mixFrom}
        to={value.mixTo}
        onChange={(mixFrom, mixTo) => onChange({ era: "mix", mixFrom, mixTo })}
      />
      <label className="block">
        <span className="mb-2 block text-xs font-medium tracking-[0.16em] text-muted uppercase">
          Genre
        </span>
        <span className="relative flex items-center">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
            <GenreArt id={value.mixGenre} />
          </span>
          <select
            value={value.mixGenre}
            aria-label="Genre"
            onChange={(event) => {
              sfxTick();
              onChange({ era: "mix", mixGenre: event.target.value as GenreId });
            }}
            className={cn(SELECT, "pl-12")}
          >
            {GENRES.map((id) => (
              <option key={id} value={id}>
                {GENRE_LABELS[id]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
        </span>
      </label>
    </div>
  );
}

export function GameOptions({ value, onChange, online }: GameOptionsProps) {
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
              columns="grid-cols-2 sm:grid-cols-3"
            />
          </div>
          <p className="mt-2 text-sm text-muted">{VARIANT_BLURBS[value.variant]}</p>
        </section>

        <section>
          <h2 className="text-sm font-medium text-fg">Ziel und Joker</h2>
          <div className="mt-3 grid gap-5">
            <SnapSlider
              label="Karten"
              value={value.target}
              min={6}
              max={10}
              step={2}
              display={`${value.target}`}
              onChange={(target) => onChange({ target: target as 6 | 8 | 10 })}
            />
            <SnapSlider
              label="Joker"
              value={value.tokens}
              min={0}
              max={2}
              step={1}
              display={value.tokens === 0 ? "Keine" : String(value.tokens)}
              onChange={(tokens) => onChange({ tokens: tokens as TokenCount })}
            />
          </div>
          <p className="mt-2 text-sm text-muted">Karten bis zum Sieg · Joker pro Person.</p>
        </section>
      </div>

      {online ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-fg">Nächste Runde</h2>
          <div className="mt-3 max-w-md">
            <Choice
              items={NEXT_ROUND_OPTIONS}
              value={value.nextRound}
              onChange={(nextRound) => onChange({ nextRound: nextRound as NextRoundPolicy })}
              label={(item) => NEXT_ROUND_LABELS[item]}
              columns="grid-cols-2"
            />
          </div>
          <p className="mt-2 text-sm text-muted">{NEXT_ROUND_BLURB[value.nextRound]}</p>
        </section>
      ) : null}

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
                    onMouseEnter={() => {
                      if (id !== value.era) sfxHover();
                    }}
                    onClick={() => {
                      if (id !== value.era) sfxTick();
                      onChange({ era: id });
                    }}
                    className={cn(
                      CHIP,
                      "overflow-hidden",
                      value.era === id
                        ? "pack-selected h-auto flex-col items-stretch py-2 text-primary-fg bg-primary"
                        : "bg-raised text-fg shadow-border hover:bg-surface",
                    )}
                  >
                    <span className={cn("pack-sleeve", value.era === id && "is-open")}>
                      <span className="pack-sleeve-inner flex justify-center">
                        <PackArt id={id} className="pack-cover" />
                      </span>
                    </span>
                    <span className="truncate">{ERA_LABELS[id]}</span>
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
  const round = config.nextRound === "all" ? "alle starten neu" : "Host startet neu";
  if (config.era === "playlist" && config.playlistLabel) {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · ${config.playlistLabel}`;
  }
  if (config.era === "mix") {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · Mix ${config.mixFrom}–${config.mixTo} · ${GENRE_LABELS[config.mixGenre]}`;
  }
  return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · ${ERA_LABELS[config.era]}`;
}
