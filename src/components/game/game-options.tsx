import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { peekPlaylist } from "@/lib/game/playlist";
import { markPreviewHintSeen, previewHintSeen } from "@/lib/game/preview-hint";
import { packSize, songsForEras } from "@/lib/game/packs";
import { countFittingFor } from "@/lib/game/extras";
import { getFreshSongs, subscribeFresh } from "@/lib/game/fresh";
import { dealCount, pileStatus, type PileStatus } from "@/lib/game/engine";
import { sfxHover, sfxSlide, sfxTick } from "@/lib/game/audio";
import { GenreArt, PackArt } from "@/components/game/pack-art";
import { MenuSelect } from "@/components/game/menu-select";
import { noteMixYears, notePack, noteVariant } from "@/lib/gags";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { SpotifyConnect, useSpotifyConnected } from "./spotify-connect";
import {
  DEFAULT_CUSTOM,
  DEFAULT_POOL,
  DEFAULT_TOKENS,
  ERA_BLURBS,
  ERA_LABELS,
  GENRE_BLURBS,
  GENRE_IDS,
  GENRE_LABELS,
  NEXT_ROUND_BLURB,
  NEXT_ROUND_LABELS,
  NEXT_ROUND_OPTIONS,
  PACK_GROUPS,
  POOL_MAX,
  POOL_MIN,
  POOL_STEP,
  TARGET_MAX,
  TARGET_MIN,
  TARGET_STEP,
  clampPool,
  clampTarget,
  guessKind,
  MAX_PACKS,
  packPatch,
  parseEras,
  parseSuggest,
  SUGGEST_IDS,
  SUGGEST_LABELS,
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
  type SuggestMode,
  type TokenCount,
  type CatalogSong,
} from "@/lib/game/types";
import { cn } from "@/lib/utils";

type GameOptionsProps = {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
  online?: boolean;
  players?: number;
  solo?: boolean;
};

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
  const index = Math.max(0, items.indexOf(value));
  const count = items.length;
  return (
    <div className="relative flex rounded-md bg-raised p-0.5 shadow-border" role="group">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 rounded-sm bg-primary transition-transform duration-200 ease-soft motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.25rem) / ${count})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
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
              "relative z-10 h-8 min-w-0 flex-1 truncate rounded-sm px-2 text-xs font-medium transition-colors duration-200 ease-soft motion-reduce:transition-none",
              on ? "text-primary-fg" : "text-muted hover:text-fg",
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

function playlistPlayable(label: string) {
  const current = label.match(/(\d+)\s+von\s+(\d+)\s+mit Hörprobe/);
  if (current) return Number(current[1]);
  const legacy = label.match(/(\d+)\s*Titel/);
  return legacy ? Number(legacy[1]) : null;
}

function PreviewHintDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) markPreviewHintSeen();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="dialog-panel fixed inset-x-3 top-1/2 z-50 max-h-[min(36rem,calc(100dvh-2rem))] w-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-5 shadow-lift sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:p-7">
          <Dialog.Title className="font-display text-2xl font-medium text-fg">
            Fehlende Hörproben
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted">
            Jahrgang kann nur Titel abspielen, für die eine Kurzvorschau erreichbar ist (in der Regel
            30 Sekunden). Die Abfrage geht an iTunes und Deezer. Bei Spotify-Playlists wird zusätzlich
            das Feld audioPreview der öffentlichen Einbettung gelesen. Die Spotify Web API liefert für
            viele Titel kein preview_url. Fehlt die URL dort und gibt es keinen Treffer bei iTunes oder
            Deezer, bleibt der Titel ohne Hörprobe und kommt nicht in den Stapel.
          </Dialog.Description>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Typische Ursachen: der Rechteinhaber stellt keine Kurzvorschau bereit, der Titel ist im
            deutschen Store-Katalog nicht vorhanden, oder es handelt sich um Spoken-Word-, Podcast-
            oder Regionalversionen ohne passenden Store-Eintrag. Die übrigen Titel der Liste bleiben
            spielbar.
          </p>
          <div className="mt-5 flex justify-end">
            <Dialog.Close asChild>
              <Button type="button">Verstanden</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  const [hintOpen, setHintOpen] = useState(false);
  const playable = playlistPlayable(value.playlistLabel);

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
      playlistLabel: `${result.peek.title} · ${result.peek.playable} von ${result.peek.count} mit Hörprobe`,
    });
    if (result.peek.playable < result.peek.count && !previewHintSeen()) {
      setHintOpen(true);
    }
  }

  const missing = playable !== null && value.playlistLabel.includes("von") && playable === 0;

  return (
    <div className="mt-3 rounded-xl bg-raised p-4 shadow-border" data-playlist-field>
      <p className="text-sm text-muted">
        Öffentlichen Spotify- oder Deezer-Link einfügen oder Zeilen im Format Interpret – Titel.
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
          {pending ? "Hörproben prüfen…" : draft.trim() ? "Prüfen" : "Leeren"}
        </Button>
      </div>
      {value.playlistLabel ? <p className="mt-2 text-sm text-fg">{value.playlistLabel}</p> : null}
      {value.playlistLabel.includes("von") && playable !== null ? (
        <button
          type="button"
          className="mt-1 text-sm text-muted underline-offset-2 transition-colors duration-150 hover:text-fg hover:underline"
          onClick={() => setHintOpen(true)}
        >
          Warum haben Titel keine Hörprobe?
        </button>
      ) : null}
      {missing ? (
        <p className="mt-2 text-sm text-danger">Kein Titel mit Hörprobe. Die Liste kann nicht gespielt werden.</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <PreviewHintDialog open={hintOpen} onOpenChange={setHintOpen} />
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
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const origin = useRef<number | null>(null);
  const span = max - min;
  const pct = span <= 0 ? 0 : ((value - min) / span) * 100;
  const slide = armed && !dragging;

  useEffect(() => {
    setArmed(true);
  }, []);

  function endDrag() {
    origin.current = null;
    setDragging(false);
  }

  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm tabular-nums text-fg">{display}</span>
      </span>
      <div className="relative mt-2 h-11">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[0.6875rem] top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-raised shadow-border"
        >
          <div
            className={cn(
              "h-full rounded-full bg-primary",
              slide && "transition-[width] duration-200 ease-soft motion-reduce:transition-none",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 size-[1.375rem] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_4px_var(--color-bg)]",
            slide && "transition-[left] duration-200 ease-soft motion-reduce:transition-none",
          )}
          style={{ left: `calc(0.6875rem + (100% - 1.375rem) * ${pct / 100})` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
          onPointerDown={(event) => {
            origin.current = event.clientX;
          }}
          onPointerMove={(event) => {
            if (origin.current == null) return;
            if (Math.abs(event.clientX - origin.current) > 5) {
              setDragging(true);
              origin.current = null;
            }
          }}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (next !== value) sfxTick();
            onChange(next);
          }}
        />
      </div>
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
        onChange={(mixFrom, mixTo) => onChange({ mixFrom, mixTo })}
      />
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Genre</p>
        <MenuSelect
          ariaLabel="Genre"
          name="genre"
          value={value.mixGenre}
          onChange={(mixGenre) => onChange({ mixGenre })}
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

function SuggestTune({
  value,
  onChange,
}: {
  value: SuggestMode;
  onChange: (next: SuggestMode) => void;
}) {
  const mode = parseSuggest(value);
  return (
    <div className="py-3">
      <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted uppercase">Autocomplete</p>
      <Segment
        items={SUGGEST_IDS}
        value={mode}
        onChange={(suggest) => onChange(suggest as SuggestMode)}
        label={(item) => SUGGEST_LABELS[item]}
      />
      <p className="mt-2 text-xs text-muted">
        {mode === "off"
          ? "Keine Vorschläge während der Eingabe."
          : mode === "loose"
            ? "Vorschläge aus Katalog und MusicBrainz. Der Interpret grenzt die Titel nicht ein."
            : "Vorschläge aus Katalog und MusicBrainz. Der Interpret grenzt die Titel ein."}
      </p>
    </div>
  );
}

function CustomTune({
  value,
  onChange,
  suggest,
  onSuggest,
}: {
  value: CustomRules;
  onChange: (next: CustomRules) => void;
  suggest: SuggestMode;
  onSuggest: (next: SuggestMode) => void;
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
      {value.guess === "both" ? (
        <SuggestTune value={suggest} onChange={onSuggest} />
      ) : null}
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
        hint={value.warp ? "Andere Geschwindigkeit." : "Normales Tempo."}
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

function liveExtras() {
  return [...(useSpotify.getState().library ?? []), ...getFreshSongs()];
}

function primaryPile(value: RoomConfig, extras: CatalogSong[] = liveExtras()) {
  if (value.era === "likes") return extras.length;
  if (value.era === "playlist") {
    return playlistPlayable(value.playlistLabel);
  }
  return packSize(value.era, mixOf(value));
}

function pileCount(value: RoomConfig, extras: CatalogSong[] = liveExtras()) {
  const packs = parseEras(value.era, value.extraEra, value.eras);
  const mix = mixOf(value);
  const catalogSongs = songsForEras(packs, mix);
  const fitting = countFittingFor(extras, packs, mix, new Set(catalogSongs.map((song) => song.id)));
  if (packs.includes("playlist")) {
    const listed = primaryPile({ ...value, era: "playlist" }, extras);
    if (listed === null && catalogSongs.length === 0 && fitting === 0) return null;
    return catalogSongs.length + (listed ?? 0) + fitting;
  }
  return catalogSongs.length + fitting;
}

function packItems(exclude: Set<EraId>, spotifyUser: boolean, libraryCount: number | null) {
  const items = PACK_GROUPS.flatMap((group) =>
    group.ids
      .filter((id) => {
        if (exclude.has(id)) return false;
        if (id === "likes" && !SPOTIFY_LIVE) return false;
        return true;
      })
      .map((id) => ({
        id,
        group: group.title,
        label: ERA_LABELS[id],
        blurb:
          id === "likes"
            ? `${ERA_BLURBS[id]} ${libraryCount ?? 0} Titel.`
            : `${ERA_BLURBS[id]} ${packSize(id)} Titel.`,
        art: <PackArt id={id} className="size-7" />,
      })),
  );
  if (!spotifyUser) {
    return items.filter((item) => item.id !== "likes");
  }
  return items;
}

function OwnSources({
  value,
  onChange,
}: {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
}) {
  const packs = parseEras(value.era, value.extraEra, value.eras);
  const mixOn = packs.includes("mix");
  const playlistOn = packs.includes("playlist");

  function setOwn(id: "mix" | "playlist", on: boolean) {
    const catalog = packs.filter((pack) => pack !== "mix" && pack !== "playlist");
    const nextMix = id === "mix" ? on : mixOn;
    const nextPlaylist = id === "playlist" ? on : playlistOn;
    const ownSlots = Number(nextMix) + Number(nextPlaylist);
    const kept =
      catalog[0] === "all"
        ? (["all"] as EraId[])
        : catalog.slice(0, Math.max(0, MAX_PACKS - ownSlots));
    const next = [...kept];
    if (nextMix) next.push("mix");
    if (nextPlaylist) next.push("playlist");
    sfxTick();
    onChange(packPatch(next.length ? next : ["all"]));
    notePack(id);
  }

  return (
    <div className="mt-4 rounded-xl bg-raised p-4 shadow-border">
      <p className="text-sm font-medium text-fg">Mix und Playlist</p>
      <p className="mt-1 text-sm text-muted">
        Liegen außerhalb der Katalog-Liste. Mix setzt Zeitraum und Genre. Playlist lädt eine
        öffentliche Liste und prüft, wie viele Titel eine Hörprobe haben.
      </p>
      <div className="mt-1 divide-y divide-border">
        <SwitchRow
          label="Mix"
          hint={mixOn ? "Zeitraum und Genre sind aktiv." : "Aus."}
          on={mixOn}
          onChange={(on) => setOwn("mix", on)}
        />
        <SwitchRow
          label="Playlist"
          hint={playlistOn ? "Link oder Titelliste ist aktiv." : "Aus."}
          on={playlistOn}
          onChange={(on) => setOwn("playlist", on)}
        />
      </div>
    </div>
  );
}

function PackList({
  value,
  onChange,
  extras,
  spotifyUser,
  libraryCount,
  login,
}: {
  value: RoomConfig;
  onChange: (patch: Partial<RoomConfig>) => void;
  extras: CatalogSong[];
  spotifyUser: boolean;
  libraryCount: number | null;
  login: () => void;
}) {
  const packs = parseEras(value.era, value.extraEra, value.eras);
  const catalogPacks = packs.filter((id) => id !== "mix" && id !== "playlist");
  const ownPacks = packs.filter((id) => id === "mix" || id === "playlist");
  const mix = mixOf(value);
  const [picker, setPicker] = useState<"add" | number | null>(null);
  const taken = new Set(catalogPacks);
  const addItems = packItems(taken, spotifyUser, libraryCount);
  const canAdd =
    catalogPacks[0] !== "all" && catalogPacks.length + ownPacks.length < MAX_PACKS && addItems.length > 0;

  function apply(nextCatalog: EraId[]) {
    sfxTick();
    onChange(packPatch([...nextCatalog.filter((id) => id !== "mix" && id !== "playlist"), ...ownPacks]));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= catalogPacks.length) return;
    const next = catalogPacks.slice();
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    apply(next);
  }

  const pickerItems =
    picker === "add"
      ? addItems
      : typeof picker === "number"
        ? packItems(new Set(catalogPacks.filter((_, i) => i !== picker)), spotifyUser, libraryCount)
        : [];

  return (
    <div className="mt-4 space-y-2">
      {catalogPacks.map((id, index) => {
        const n =
          id === "likes"
            ? extras.length
            : packSize(id, mix);
        return (
          <div
            key={`${id}-${index}`}
            className="flex h-14 items-center gap-2 rounded-md bg-raised px-2 shadow-border"
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-sm px-1 text-left text-fg transition-colors duration-150 ease-out hover:bg-surface"
              onClick={() => setPicker(index)}
            >
              <PackArt id={id} className="size-7 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{ERA_LABELS[id]}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {n === null ? "…" : `${n}`}
              </span>
            </button>
            <div className="flex shrink-0 items-center">
              {catalogPacks.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Nach oben"
                    disabled={index === 0}
                    className="flex size-10 items-center justify-center text-muted transition-colors duration-150 ease-out hover:text-fg disabled:opacity-30"
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Nach unten"
                    disabled={index === catalogPacks.length - 1}
                    className="flex size-10 items-center justify-center text-muted transition-colors duration-150 ease-out hover:text-fg disabled:opacity-30"
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </>
              ) : null}
              {catalogPacks.length > 1 || ownPacks.length > 0 ? (
                <button
                  type="button"
                  aria-label="Pack entfernen"
                  className="flex size-10 items-center justify-center text-muted transition-colors duration-150 ease-out hover:text-fg"
                  onClick={() => apply(catalogPacks.filter((_, i) => i !== index))}
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {picker !== null ? (
        <MenuSelect
          ariaLabel={picker === "add" ? "Pack dazu" : "Pack ersetzen"}
          name="pack-picker"
          placeholder={picker === "add" ? "Pack dazu" : "Pack ersetzen"}
          defaultOpen
          items={pickerItems}
          onChange={(id) => {
            if (id === "likes" && !spotifyUser) {
              login();
              setPicker(null);
              return;
            }
            if (picker === "add") apply([...catalogPacks, id]);
            else {
              const next: EraId[] = catalogPacks.slice();
              next[picker] = id;
              apply(next);
            }
            notePack(id);
            setPicker(null);
          }}
          onDismiss={() => setPicker(null)}
        />
      ) : canAdd ? (
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm text-muted shadow-border transition-[background-color,color,transform] duration-150 ease-out hover:-translate-y-px hover:bg-raised hover:text-fg active:scale-[0.96]"
          onClick={() => setPicker("add")}
        >
          <Plus className="size-4" />
          Pack dazu
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
  const pile = pileCount(value, liveExtras());
  const open = isOpenPlay(value);
  const pool = value.variant === "custom" ? clampPool(value.pool) : undefined;
  return {
    pile,
    need: dealCount(players, value.target, open, pool),
    status: pileStatus(pile, players, value.target, open, pool) as PileStatus,
  };
}

function PileNote({
  value,
  players,
  solo,
}: {
  value: RoomConfig;
  players: number;
  solo?: boolean;
}) {
  const { pile, need, status } = optionsPile(value, players);
  if (solo && status !== "empty") return null;
  if (status === "ok") return null;
  if (status === "unknown") {
    return (
      <p className="mt-3 rounded-md bg-raised px-3 py-2 text-sm text-muted shadow-border">
        Liste übernehmen. Danach steht, wie viele Titel eine Hörprobe haben.
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

export function GameOptions({ value, onChange, online, players = 2, solo = false }: GameOptionsProps) {
  const custom = value.custom ?? DEFAULT_CUSTOM;
  const showTarget = value.variant !== "custom" || !custom.open;
  const showPool = value.variant === "custom";
  const libraryCount = useSpotify((s) => s.libraryCount);
  const library = useSpotify((s) => s.library);
  const [fresh, setFresh] = useState(getFreshSongs);
  useEffect(() => subscribeFresh(() => setFresh(getFreshSongs())), []);
  const extras = [...library, ...fresh];
  const pile = pileCount(value, extras);
  const packs = parseEras(value.era, value.extraEra, value.eras);
  const spotifyUser = useSpotifyConnected();
  const login = useSpotify((s) => s.login);
  const extraFit = countFittingFor(
    extras,
    packs,
    mixOf(value),
    new Set(songsForEras(packs, mixOf(value)).map((song) => song.id)),
  );
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
                if (variant === "original") onChange({ variant, tokens: 0 });
                else if (value.variant === "original" && value.tokens === 0) {
                  onChange({ variant, tokens: DEFAULT_TOKENS });
                } else onChange({ variant });
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
            <CustomTune
              value={custom}
              onChange={(next) => onChange({ custom: next })}
              suggest={parseSuggest(value.suggest)}
              onSuggest={(suggest) => onChange({ suggest })}
            />
          ) : null}
          {guessKind(value.variant, custom) === "both" && value.variant !== "custom" ? (
            <div className="mt-4 divide-y divide-border rounded-xl bg-raised px-4 py-1 shadow-border">
              <SuggestTune
                value={parseSuggest(value.suggest)}
                onChange={(suggest) => onChange({ suggest })}
              />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-sm font-medium text-fg">{showTarget ? "Ziel und Joker" : "Stapel und Joker"}</h2>
          <div className="mt-3 grid gap-5">
            {showTarget ? (
              <SnapSlider
                label="Karten"
                value={clampTarget(value.target)}
                min={TARGET_MIN}
                max={TARGET_MAX}
                step={TARGET_STEP}
                display={`${clampTarget(value.target)}`}
                onChange={(target) => onChange({ target: clampTarget(target) })}
              />
            ) : null}
            {showPool ? (
              <SnapSlider
                label="Stapel"
                value={clampPool(value.pool ?? DEFAULT_POOL)}
                min={POOL_MIN}
                max={POOL_MAX}
                step={POOL_STEP}
                display={`${clampPool(value.pool ?? DEFAULT_POOL)} Titel`}
                onChange={(pool) => onChange({ pool: clampPool(pool) })}
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
                ? "Kein Kartenziel. Der Stapel läuft sich leer — Größe oben einstellen."
                : "Karten bis zum Sieg. Der Stapel kann größer sein als das Ziel."
              : value.variant === "original"
                ? "Kenner startet ohne Joker. Beides richtig gibt einen dazu."
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
                : `${pile} Titel im Stapel`}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted">
          {packs.length > 1
            ? packs.map((id) => ERA_LABELS[id]).join(" + ") + ". Doppelte Titel einmal."
            : ERA_BLURBS[packs[0] ?? value.era]}
        </p>
        <PackList
          value={value}
          onChange={onChange}
          extras={extras}
          spotifyUser={Boolean(spotifyUser)}
          libraryCount={libraryCount}
          login={login}
        />
        <OwnSources value={value} onChange={onChange} />
        {packs.includes("playlist") ? <PlaylistField value={value} onChange={onChange} /> : null}
        {packs.includes("mix") ? <MixField value={value} onChange={onChange} /> : null}
        {SPOTIFY_LIVE ? (
          <div className="mt-4">
            <SpotifyConnect compact />
          </div>
        ) : null}
        {extraFit > 0 ? (
          <p className="mt-2 text-xs text-subtle">
            {extraFit} extra Titel
            {spotifyUser ? " aus deinem Spotify" : ""}
            {fresh.length ? (spotifyUser ? " und frischen Charts" : " aus frischen Charts") : ""}
            , die zum Pack passen.
          </p>
        ) : null}
        <PileNote value={value} players={players} solo={solo} />
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
  const extraPacks = parseEras(config.era, config.extraEra, config.eras);
  const packLabel = extraPacks.map((id) => ERA_LABELS[id]).join(" + ");
  const more = extraPacks.filter((id) => id !== extraPacks[0]).map((id) => ERA_LABELS[id]);
  const moreLabel = more.length ? ` + ${more.join(" + ")}` : "";
  const open = isOpenPlay(config);
  const goal = open ? `${clampPool(config.pool)} im Stapel` : `${clampTarget(config.target)} Karten`;
  if (extraPacks.includes("playlist") && config.playlistLabel) {
    return `${VARIANT_LABELS[config.variant]} · ${goal} · ${joker} · ${round} · ${config.playlistLabel}${moreLabel}${extra}`;
  }
  if (extraPacks.includes("mix")) {
    return `${VARIANT_LABELS[config.variant]} · ${goal} · ${joker} · ${round} · Mix ${config.mixFrom}–${config.mixTo} · ${GENRE_LABELS[config.mixGenre]}${moreLabel}${extra}`;
  }
  return `${VARIANT_LABELS[config.variant]} · ${goal} · ${joker} · ${round} · ${packLabel}${extra}`;
}
