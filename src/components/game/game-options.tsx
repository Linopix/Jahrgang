import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { peekPlaylist } from "@/lib/game/playlist";
import { packSize, songsForPacks } from "@/lib/game/packs";
import { cardsNeeded, pileStatus, type PileStatus } from "@/lib/game/engine";
import { sfxHover, sfxSlide, sfxTick } from "@/lib/game/audio";
import { GenreArt, PackArt } from "@/components/game/pack-art";
import { MenuSelect } from "@/components/game/menu-select";
import { noteMixYears, notePack, noteVariant } from "@/lib/gags";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { SpotifyConnect, useSpotifyConnected } from "./spotify-connect";
import {
  DEFAULT_CUSTOM,
  ERA_BLURBS,
  ERA_LABELS,
  GENRE_BLURBS,
  GENRE_IDS,
  GENRE_LABELS,
  NEXT_ROUND_BLURB,
  NEXT_ROUND_LABELS,
  NEXT_ROUND_OPTIONS,
  PACK_GROUPS,
  parseExtraEra,
  VARIANT_BLURBS,
  VARIANT_IDS,
  VARIANT_LABELS,
  YEAR_MAX,
  YEAR_MIN,
  type CustomRules,
  type EraId,
  type GuessKind,
  type LineRule,
  type NextRoundPolicy,
  type RoomConfig,
  type TokenCount,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

type GameOptionsProps = {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
  online?: boolean;
  players?: number;
};

const CHIP =
  "flex h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px active:scale-[0.96]";

const PACK_MENU = PACK_GROUPS.filter((group) => group.title !== "Eigene");
const PACK_IDS = PACK_MENU.flatMap((group) => group.ids);
const OWN_PACKS = ["mix", "playlist", "likes"] as const satisfies readonly EraId[];

function SleeveChip({
  selected,
  label,
  art,
  packId,
  genreId,
  onSelect,
}: {
  selected: boolean;
  label: string;
  art: ReactNode;
  packId?: string;
  genreId?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-pack={packId}
      data-genre={genreId}
      onMouseEnter={() => {
        if (!selected) sfxHover();
      }}
      onClick={() => {
        if (!selected) sfxTick();
        onSelect();
      }}
      className={cn(
        CHIP,
        selected
          ? "text-primary-fg bg-primary"
          : "bg-raised text-fg shadow-border hover:bg-surface",
      )}
    >
      {art}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Segment<T extends string | number>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly T[];
  value: T;
  onChange: (next: T) => void;
  label: (item: T) => string;
}) {
  return (
    <div className="flex rounded-md bg-raised p-0.5 shadow-border" role="group">
      {items.map((item) => {
        const on = item === value;
        return (
          <button
            key={String(item)}
            type="button"
            onMouseEnter={() => {
              if (!on) sfxHover();
            }}
            onClick={() => {
              if (!on) sfxTick();
              onChange(item);
            }}
            className={cn(
              "h-8 min-w-0 flex-1 truncate rounded-sm px-2 text-xs font-medium transition-colors duration-150",
              on ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
            )}
          >
            {label(item)}
          </button>
        );
      })}
    </div>
  );
}

function SwitchRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        onChange(!on);
        sfxTick();
      }}
      className="flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm text-fg">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors duration-150 ease-out",
          on ? "bg-primary" : "bg-surface shadow-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full transition-transform duration-150 ease-out",
            on ? "translate-x-4 bg-primary-fg" : "bg-fg",
          )}
        />
      </span>
    </button>
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
      <DualYearSlider
        from={value.mixFrom}
        to={value.mixTo}
        onChange={(mixFrom, mixTo) => onChange({ era: "mix", mixFrom, mixTo })}
      />
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Genre</p>
        <MenuSelect
          ariaLabel="Genre"
          name="genre"
          value={value.mixGenre}
          onChange={(mixGenre) => onChange({ era: "mix", mixGenre })}
          items={GENRE_IDS.map((id) => ({
            id,
            label: GENRE_LABELS[id],
            blurb: GENRE_BLURBS[id],
            art: <GenreArt id={id} className="size-7" />,
          }))}
        />
      </div>
      <p className="text-xs tabular-nums text-subtle">
        {packSize("mix", {
          from: value.mixFrom,
          to: value.mixTo,
          genre: value.mixGenre,
        })}{" "}
        Titel im Stapel
      </p>
    </div>
  );
}

function CustomTune({
  value,
  onChange,
}: {
  value: CustomRules;
  onChange: (next: CustomRules) => void;
}) {
  return (
    <div className="mt-4 divide-y divide-border rounded-xl bg-raised px-4 py-1 shadow-border" data-custom-tune>
      <div className="py-3">
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Raten</p>
        <Segment
          items={["none", "artist", "title", "both"] as const}
          value={value.guess}
          onChange={(guess) => onChange({ ...value, guess: guess as GuessKind })}
          label={(item) =>
            item === "none" ? "Keins" : item === "artist" ? "Interpret" : item === "title" ? "Titel" : "Beides"
          }
        />
      </div>
      <div className="py-3">
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Linie</p>
        <Segment
          items={["chrono", "reverse", "free"] as const}
          value={value.line}
          onChange={(line) => onChange({ ...value, line: line as LineRule })}
          label={(item) => (item === "chrono" ? "Früh → spät" : item === "reverse" ? "Spät → früh" : "Frei")}
        />
      </div>
      <SwitchRow
        label="Cover zu"
        hint={value.cover ? "Erst beim Aufdecken." : "Cover siehst du beim Hören."}
        on={value.cover}
        onChange={(cover) => onChange({ ...value, cover })}
      />
      <SwitchRow
        label="Jahre versteckt"
        hint={value.hideYear ? "Ohne Jahreszahl auf der Karte." : "Jahre stehen auf der Linie."}
        on={value.hideYear}
        onChange={(hideYear) => onChange({ ...value, hideYear })}
      />
      <SwitchRow
        label="Tempo verzogen"
        hint={value.warp ? "Die Platte läuft verkehrt." : "Normales Tempo."}
        on={value.warp}
        onChange={(warp) => onChange({ ...value, warp })}
      />
      <SwitchRow
        label="Bis der Stapel leer ist"
        hint={value.open ? "Kein Kartenziel." : "Sieg bei der eingestellten Kartenanzahl."}
        on={value.open}
        onChange={(open) => onChange({ ...value, open })}
      />
    </div>
  );
}

function mixOf(value: RoomConfig) {
  return { from: value.mixFrom, to: value.mixTo, genre: value.mixGenre };
}

function primaryPile(value: RoomConfig, libraryCount: number | null = null) {
  if (value.era === "likes") return libraryCount ?? 0;
  if (value.era === "playlist") {
    const match = value.playlistLabel.match(/(\d+)\s*Titel/);
    return match ? Number(match[1]) : null;
  }
  return packSize(value.era, mixOf(value));
}

function pileCount(value: RoomConfig, libraryCount: number | null = null) {
  const extra = parseExtraEra(value.extraEra, value.era);
  const lib = extra === "likes" || value.era === "likes" ? libraryCount ?? 0 : 0;
  if (value.era === "likes") {
    if (!extra || extra === "likes") return lib;
    return lib + packSize(extra, mixOf(value));
  }
  if (value.era === "playlist") {
    const base = primaryPile(value, libraryCount);
    if (!extra) return base;
    const added = extra === "likes" ? lib : packSize(extra, mixOf(value));
    if (base === null) return added || null;
    return base + added;
  }
  const catalog = songsForPacks(value.era, extra === "likes" ? null : extra, mixOf(value)).length;
  return extra === "likes" ? catalog + lib : catalog;
}

function eraPatch(value: RoomConfig, era: EraId): Partial<RoomConfig> {
  return {
    era,
    extraEra: era === "all" ? null : parseExtraEra(value.extraEra, era),
  };
}

function ExtraPack({
  value,
  onChange,
  players,
}: {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
  players: number;
}) {
  const extra = parseExtraEra(value.extraEra, value.era);
  const spotifyUser = useSpotifyConnected();
  const libraryCount = useSpotify((s) => s.libraryCount);
  const without = optionsPile({ ...value, extraEra: null }, players);
  const show =
    Boolean(extra) || without.status === "short" || without.status === "tight" || without.status === "empty";
  if (!show || value.era === "all") return null;
  const extraItems = PACK_MENU.flatMap((group) =>
    group.ids
      .filter((id) => id !== value.era)
      .map((id) => ({
        id,
        group: group.title,
        label: ERA_LABELS[id],
        blurb: `${ERA_BLURBS[id]} ${packSize(id)} Titel.`,
        art: <PackArt id={id} className="size-7" />,
      })),
  );
  if (SPOTIFY_LIVE && spotifyUser && value.era !== "likes") {
    extraItems.push({
      id: "likes" as EraId,
      group: "Eigene",
      label: ERA_LABELS.likes,
      blurb: `${ERA_BLURBS.likes} ${libraryCount ?? 0} Titel.`,
      art: <PackArt id="likes" className="size-7" />,
    });
  }
  return (
    <div className="mt-4" data-extra-pack>
      <h3 className="text-sm font-medium text-fg">Zweites Repertoire</h3>
      <p className="mt-1 text-sm text-muted">
        {extra
          ? `${ERA_LABELS[value.era]} plus ${ERA_LABELS[extra]}. Doppelte Titel einmal.`
          : "Das Pack reicht nicht. Ein zweites dazu, der Stapel mischt beide."}
      </p>
      <div className="mt-3">
        <MenuSelect
          ariaLabel="Zweites Repertoire"
          name="extra-repertoire"
          placeholder="Pack oder Stil dazu"
          value={extra ?? undefined}
          onChange={(next) => onChange({ extraEra: next })}
          items={extraItems}
        />
      </div>
      {extra ? (
        <button
          type="button"
          className="mt-2 text-sm text-muted transition-colors hover:text-fg"
          onClick={() => onChange({ extraEra: null })}
        >
          Nur {ERA_LABELS[value.era]}
        </button>
      ) : null}
    </div>
  );
}

function isOpenPlay(value: RoomConfig) {
  if (value.variant !== "custom") return false;
  return (value.custom ?? DEFAULT_CUSTOM).open;
}

export function optionsPile(value: RoomConfig, players: number) {
  const pile = pileCount(value, useSpotify.getState().libraryCount);
  const open = isOpenPlay(value);
  return {
    pile,
    need: cardsNeeded(players, value.target, open),
    status: pileStatus(pile, players, value.target, open) as PileStatus,
  };
}

function PileNote({
  value,
  players,
}: {
  value: RoomConfig;
  players: number;
}) {
  const { pile, need, status } = optionsPile(value, players);
  if (status === "ok") return null;
  if (status === "unknown") {
    return (
      <p className="mt-3 rounded-md bg-raised px-3 py-2 text-sm text-muted shadow-border">
        Liste übernehmen, dann sehen wir ob der Stapel reicht.
      </p>
    );
  }
  if (status === "empty") {
    return (
      <p className="mt-3 rounded-md bg-danger/15 px-3 py-2 text-sm text-fg">
        Kein Titel in dem Pack. Anderes Repertoire oder Mix weiter stellen.
      </p>
    );
  }
  if (status === "short") {
    return (
      <p className="mt-3 rounded-md bg-danger/15 px-3 py-2 text-sm text-fg">
        Zu wenig für {players} {players === 1 ? "Person" : "Personen"}
        {isOpenPlay(value) ? "" : ` mit ${value.target} Karten`}. Es braucht {need} Titel, das Pack hat {pile}.
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-md bg-raised px-3 py-2 text-sm text-muted shadow-border">
      Knapper Stapel ({pile} Titel, {need} nötig). Beim Start können Titel ohne Vorschau fehlen.
    </p>
  );
}

export function GameOptions({ value, onChange, online, players = 2 }: GameOptionsProps) {
  const custom = value.custom ?? DEFAULT_CUSTOM;
  const showTarget = value.variant !== "custom" || !custom.open;
  const libraryCount = useSpotify((s) => s.libraryCount);
  const spotifyUser = useSpotifyConnected();
  const login = useSpotify((s) => s.login);
  const pile = pileCount(value, libraryCount);
  const extra = parseExtraEra(value.extraEra, value.era);
  const base = primaryPile(value, libraryCount);
  const ownPacks = OWN_PACKS.filter((id) => id !== "likes" || SPOTIFY_LIVE);
  return (
    <div>
      <div className="mt-8 grid gap-8 lg:mt-0 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium text-fg">Spiel</h2>
          <div className="mt-3">
            <MenuSelect
              ariaLabel="Spielmodus"
              name="spiel"
              value={value.variant}
              onChange={(variant) => {
                noteVariant(variant);
                onChange({ variant });
              }}
              items={VARIANT_IDS.map((id, index) => ({
                id,
                label: VARIANT_LABELS[id],
                blurb: VARIANT_BLURBS[id],
                art: (
                  <span className="flex size-10 shrink-0 items-center justify-center font-display text-sm tabular-nums text-muted group-data-[state=checked]:text-primary-fg">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ),
              }))}
            />
          </div>
          <p className="mt-2 text-sm text-muted">{VARIANT_BLURBS[value.variant]}</p>
          {value.variant === "custom" ? (
            <CustomTune value={custom} onChange={(next) => onChange({ custom: next })} />
          ) : null}
        </section>

        <section>
          <h2 className="text-sm font-medium text-fg">Ziel und Joker</h2>
          <div className="mt-3 grid gap-5">
            {showTarget ? (
              <SnapSlider
                label="Karten"
                value={value.target}
                min={6}
                max={10}
                step={2}
                display={`${value.target}`}
                onChange={(target) => onChange({ target: target as 6 | 8 | 10 })}
              />
            ) : null}
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
          <p className="mt-2 text-sm text-muted">
            {value.variant === "custom"
              ? custom.open
                ? "Kein Kartenziel. Der Stapel läuft sich leer."
                : "Karten bis zum Sieg, Regeln wie eingestellt."
              : "Karten bis zum Sieg · Joker pro Person."}
          </p>
        </section>
      </div>

      {online ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-fg">Nächste Runde</h2>
          <div className="mt-3 max-w-md">
            <Segment
              items={NEXT_ROUND_OPTIONS}
              value={value.nextRound}
              onChange={(nextRound) => onChange({ nextRound: nextRound as NextRoundPolicy })}
              label={(item) => NEXT_ROUND_LABELS[item]}
            />
          </div>
          <p className="mt-2 text-sm text-muted">{NEXT_ROUND_BLURB[value.nextRound]}</p>
        </section>
      ) : null}

      {online ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-fg">Emoji und Chat</h2>
          <div className="mt-1 max-w-md divide-y divide-border">
            <SwitchRow
              label="Emoji"
              hint={value.emoji ? "Reaktionen sind an." : "Keine Reaktionen."}
              on={value.emoji}
              onChange={(emoji) => onChange({ emoji })}
            />
            <SwitchRow
              label="Chat"
              hint={value.chat ? "Nachrichten sind an." : "Kein Chat."}
              on={value.chat}
              onChange={(chat) => onChange({ chat })}
            />
          </div>
          <p className="mt-2 text-sm text-muted">Nur der Host stellt das ein.</p>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-fg">Repertoire</h2>
          <p className="text-xs tabular-nums text-subtle" data-pile-size>
            {pile === null
              ? "Stapel offen"
              : pile === 0
                ? "Kein Titel"
                : extra && base !== null && pile > base
                  ? `${pile} Titel (${base} + ${pile - base})`
                  : `${pile} Titel im Stapel`}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">{ERA_BLURBS[value.era]}</p>
        <div className="mt-4">
          <MenuSelect
            ariaLabel="Repertoire"
            name="repertoire"
            placeholder="Pack wählen"
            value={PACK_IDS.includes(value.era) ? value.era : undefined}
            onChange={(era) => {
              notePack(era);
              onChange(eraPatch(value, era));
            }}
            items={PACK_MENU.flatMap((group) =>
              group.ids.map((id) => ({
                id,
                group: group.title,
                label: ERA_LABELS[id],
                blurb: `${ERA_BLURBS[id]} ${packSize(id)} Titel.`,
                art: <PackArt id={id} className="size-7" />,
              })),
            )}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ownPacks.map((id) => (
              <SleeveChip
                key={id}
                packId={id}
                selected={value.era === id}
                label={id === "likes" && !spotifyUser ? "Meine Titel" : ERA_LABELS[id]}
                art={<PackArt id={id} />}
                onSelect={() => {
                  if (id === "likes" && !spotifyUser) {
                    login();
                    return;
                  }
                  notePack(id);
                  onChange(eraPatch(value, id));
                }}
              />
            ))}
          </div>
        </div>
        {value.era === "playlist" ? <PlaylistField value={value} onChange={onChange} /> : null}
        {value.era === "mix" ? <MixField value={value} onChange={onChange} /> : null}
        {SPOTIFY_LIVE ? (
          <div className="mt-4">
            <SpotifyConnect compact />
          </div>
        ) : null}
        <ExtraPack value={value} onChange={onChange} players={players} />
        <PileNote value={value} players={players} />
      </section>
    </div>
  );
}

export function roomConfigSummary(config: RoomConfig) {
  const joker = config.tokens === 0 ? "ohne Joker" : `${config.tokens} Joker`;
  const round = config.nextRound === "all" ? "alle starten neu" : "Host startet neu";
  const social =
    config.emoji === false && config.chat === false
      ? "ohne Emoji und Chat"
      : config.emoji === false
        ? "ohne Emoji"
        : config.chat === false
          ? "ohne Chat"
          : null;
  const extra = social ? ` · ${social}` : "";
  const extraPack = parseExtraEra(config.extraEra, config.era);
  const packLabel = extraPack
    ? `${ERA_LABELS[config.era]} + ${ERA_LABELS[extraPack]}`
    : ERA_LABELS[config.era];
  if (config.era === "playlist" && config.playlistLabel) {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · ${config.playlistLabel}${extraPack ? ` + ${ERA_LABELS[extraPack]}` : ""}${extra}`;
  }
  if (config.era === "mix") {
    return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · Mix ${config.mixFrom}–${config.mixTo} · ${GENRE_LABELS[config.mixGenre]}${extraPack ? ` + ${ERA_LABELS[extraPack]}` : ""}${extra}`;
  }
  return `${VARIANT_LABELS[config.variant]} · ${config.target} Karten · ${joker} · ${round} · ${packLabel}${extra}`;
}
