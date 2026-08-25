import { create } from "zustand";
import { playStoreClip, sfxScratch, sfxWin, setDiscoAudio, setRetroAudio } from "@/lib/game/audio";
import { applyTheme, unlockTheme } from "@/lib/theme";
import { GAG_CLIPS } from "@/lib/gag-book";
import type { EraId, PlayVariant } from "@/lib/game/types";

export type GagToast = { id: number; text: string; disco?: boolean };

export const EGG_IDS = [
  "label",
  "vinyl",
  "title",
  "disco",
  "paper",
  "year",
  "name",
  "room",
  "pack",
  "mode",
  "chat",
] as const;

export type EggId = (typeof EGG_IDS)[number];
export const EGG_TOTAL = EGG_IDS.length;

const EGG_KEY = "jahrgang-eggs";
const FOUND_KEY = "jahrgang-gag-found";

function isEggId(value: string): value is EggId {
  return (EGG_IDS as readonly string[]).includes(value);
}

function readEggs(): EggId[] {
  try {
    const raw = JSON.parse(localStorage.getItem(EGG_KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is EggId => typeof item === "string" && isEggId(item));
  } catch {
    return [];
  }
}

function eggBucket(id: string): EggId | null {
  if (isEggId(id)) return id;
  if (id.startsWith("y")) return "year";
  if (id.startsWith("c-")) return "room";
  if (id.startsWith("p-")) return "pack";
  if (id.startsWith("v-")) return "mode";
  if (id === "schweinebein") return "chat";
  return "name";
}

function readFound(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FOUND_KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

let nextId = 1;
let vinylHits = 0;
let titleHits = 0;
let konami = 0;
let nameTimer = 0;
const said = new Set<string>();
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

type GagStore = {
  toasts: GagToast[];
  disco: boolean;
  scramble: boolean;
  eggs: EggId[];
  found: string[];
  push: (text: string, disco?: boolean) => void;
  drop: (id: number) => void;
  setDisco: (on: boolean) => void;
  setScramble: (on: boolean) => void;
  hydrateEggs: () => void;
  addEgg: (id: EggId) => void;
  addFound: (id: string) => void;
};

export const useGags = create<GagStore>((set, get) => ({
  toasts: [],
  disco: false,
  scramble: false,
  eggs: [],
  found: [],
  push: (text, disco) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, text, disco }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((row) => row.id !== id) }));
    }, 3200);
  },
  drop: (id) => set((state) => ({ toasts: state.toasts.filter((row) => row.id !== id) })),
  setDisco: (on) => set({ disco: on }),
  setScramble: (on) => set({ scramble: on }),
  hydrateEggs: () => {
    const found = readFound();
    found.forEach((id) => said.add(id));
    set({ eggs: readEggs(), found });
  },
  addEgg: (id) => {
    const current = get().eggs;
    if (current.includes(id)) return;
    const eggs = [...current, id];
    try {
      localStorage.setItem(EGG_KEY, JSON.stringify(eggs));
    } catch {
      /* ignore */
    }
    set({ eggs });
    if (eggs.length === EGG_TOTAL) {
      window.setTimeout(() => toastGag(`${EGG_TOTAL}/${EGG_TOTAL}. Die B-Seite ist leer.`), 900);
    }
  },
  addFound: (id) => {
    const current = get().found;
    if (current.includes(id)) return;
    const found = [...current, id];
    try {
      localStorage.setItem(FOUND_KEY, JSON.stringify(found));
    } catch {
      /* ignore */
    }
    set({ found });
  },
}));

export function toastGag(text: string) {
  useGags.getState().push(text);
}

function onceGag(id: string, text: string) {
  if (said.has(id)) return false;
  said.add(id);
  toastGag(text);
  useGags.getState().addFound(id);
  const egg = eggBucket(id);
  if (egg) useGags.getState().addEgg(egg);
  const clip = GAG_CLIPS[id];
  if (clip) void playStoreClip(clip);
  return true;
}

export function markEgg(id: EggId) {
  useGags.getState().addEgg(id);
}

export function notePaperSign() {
  markEgg("paper");
  useGags.getState().addFound("paper");
}

export function noteVinylLabel() {
  if (onceGag("label", "Die Mitte hält.")) return;
}

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasWord(name: string, word: string) {
  if (name === word) return true;
  return name.split(" ").includes(word);
}

function hasAny(name: string, words: string[]) {
  return words.some((word) => hasWord(name, word));
}

export function noteVinylClick() {
  vinylHits += 1;
  if (vinylHits < 7) return;
  vinylHits = 0;
  sfxScratch();
  toastGag("Die Nadel hängt fest.");
  markEgg("vinyl");
  useGags.getState().addFound("vinyl");
  document.querySelectorAll(".vinyl-disc").forEach((node) => {
    node.classList.add("is-stuck");
    window.setTimeout(() => node.classList.remove("is-stuck"), 1600);
  });
}

export function noteTitleClick() {
  titleHits += 1;
  if (titleHits < 5) return;
  titleHits = 0;
  useGags.getState().setScramble(true);
  toastGag("Jahrgang? Jahrgang.");
  markEgg("title");
  useGags.getState().addFound("title");
  window.setTimeout(() => useGags.getState().setScramble(false), 1400);
}

export function noteKonamiKey(key: string) {
  const expect = KONAMI[konami];
  if (key === expect || key.toLowerCase() === expect) {
    konami += 1;
    if (konami === KONAMI.length) {
      konami = 0;
      sfxWin();
      unlockTheme("disco");
      applyTheme("disco");
      setRetroAudio(false);
      setDiscoAudio(true);
      useGags.getState().setDisco(true);
      toastGag("Disco-Edit freigeschaltet. Niemand hat etwas gesehen.");
      markEgg("disco");
      useGags.getState().addFound("disco");
      const clip = GAG_CLIPS.disco;
      if (clip) void playStoreClip(clip);
      window.setTimeout(() => useGags.getState().setDisco(false), 1800);
    }
    return;
  }
  konami = key === KONAMI[0] ? 1 : 0;
}

export function noteMixYears(from: number, to: number) {
  if (from === to) {
    if (from === 1969) onceGag("y1969", "Ein kleiner Schritt für eine Playlist.");
    else if (from === 1977) onceGag("y1977", "Stayin' alive. Die Zeitlinie auch.");
    else if (from === 1982) onceGag("y1982", "Thriller. Hehe.");
    else if (from === 1984) onceGag("y1984", "Big Brother hört mit. Nur 30 Sekunden.");
    else if (from === 1987) onceGag("y1987", "Never gonna give you up. Die Playlist schon.");
    else if (from === 1999) onceGag("y1999", "Tonight. Party like it's… dieser eine Slider.");
    else if (from === 2000) onceGag("y2000", "Y2K. Die Playlist ist noch da.");
    else if (from === 2012) onceGag("y2012", "Die Zeitlinie endet hier nicht.");
  }
}

type NameGag = { id: string; test: (n: string) => boolean; text: string };

const NAME_GAGS: NameGag[] = [
  {
    id: "michael-jackson",
    test: (n) => hasWord(n, "michael") && hasWord(n, "jackson"),
    text: "Hehe. Billie Jean is not my name.",
  },
  { id: "michael", test: (n) => hasAny(n, ["michael", "mike", "michel"]), text: "Michael (Jackson). Hehe." },
  { id: "jackson", test: (n) => hasWord(n, "jackson"), text: "Thriller. Hehe." },
  { id: "elvis", test: (n) => hasWord(n, "elvis"), text: "Elvis (Presley). Hat das Gebäude verlassen." },
  { id: "madonna", test: (n) => hasWord(n, "madonna"), text: "Madonna. Like a player." },
  { id: "britney", test: (n) => hasAny(n, ["britney", "spears"]), text: "Britney (Spears). Oops." },
  { id: "adele", test: (n) => hasWord(n, "adele"), text: "Adele. Hello from the other decade." },
  { id: "taylor", test: (n) => hasAny(n, ["taylor", "swift"]), text: "Taylor (Swift). Blank Space auf der Karte." },
  { id: "eminem", test: (n) => hasAny(n, ["eminem", "marshall"]), text: "Eminem. Please stand up." },
  { id: "drake", test: (n) => hasWord(n, "drake"), text: "Drake. Started from the bottom, jetzt einordnen." },
  { id: "beyonce", test: (n) => hasWord(n, "beyonce"), text: "Beyoncé. Queen B legt später." },
  { id: "gaga", test: (n) => hasAny(n, ["gaga", "stefani"]), text: "Lady Gaga. Bad Romance mit dem Jahr." },
  { id: "rihanna", test: (n) => hasAny(n, ["rihanna", "riri"]), text: "Rihanna. Umbrella bleibt zu." },
  { id: "prince", test: (n) => hasWord(n, "prince"), text: "Prince. Purple rain auf der Zeitlinie." },
  { id: "freddie", test: (n) => hasAny(n, ["freddie", "mercury"]), text: "Freddie. Mama, just killed a year." },
  { id: "weeknd", test: (n) => hasAny(n, ["weeknd", "tesfaye"]), text: "The Weeknd. Blinding Lights bleiben an." },
  { id: "kanye", test: (n) => hasAny(n, ["kanye", "ye"]), text: "Imma let you finish. Aber das Jahr zuerst." },
  { id: "snoop", test: (n) => hasAny(n, ["snoop", "dogg"]), text: "Snoop. Die Platte läuft. Du auch." },
  { id: "shakira", test: (n) => hasWord(n, "shakira"), text: "Shakira. Hips don't lie, Jahre schon." },
  { id: "ed", test: (n) => hasAny(n, ["sheeran"]), text: "Ed Sheeran. Shape of you, Form der Zeitlinie." },
  { id: "harry", test: (n) => hasAny(n, ["harry", "styles"]), text: "Harry. As it was — ungefähr 2019." },
  { id: "beatles", test: (n) => hasAny(n, ["beatles", "lennon", "mccartney"]), text: "All you need is years." },
  { id: "abba", test: (n) => hasWord(n, "abba"), text: "ABBA. Super trouper am Tisch." },
  { id: "queen", test: (n) => hasWord(n, "queen"), text: "Queen. Bohemian — und die Zeitlinie." },
  { id: "oasis", test: (n) => hasAny(n, ["oasis", "gallagher"]), text: "Oasis. Definitely maybe das Jahr." },
  { id: "nirvana", test: (n) => hasAny(n, ["nirvana", "cobain", "kurt"]), text: "Nirvana. Smells like teen spirit, 1991." },
  { id: "bonjovi", test: (n) => hasAny(n, ["jovi"]), text: "Bon Jovi. Livin' on a prayer, und auf einem Slot." },
  { id: "linkin", test: (n) => hasAny(n, ["linkin", "chester"]), text: "In the end, it doesn't even matter… das Jahr schon." },
  { id: "nena", test: (n) => hasWord(n, "nena"), text: "Nena. 99 Luftballons, ein Name." },
  { id: "falco", test: (n) => hasAny(n, ["falco", "amadeus"]), text: "Falco. Rock me, Amadeus." },
  { id: "helene", test: (n) => hasAny(n, ["helene", "fischer"]), text: "Helene. Atemlos durch die Runde." },
  { id: "rammstein", test: (n) => hasAny(n, ["rammstein", "till"]), text: "Rammstein. Du hast… den Namen gewählt." },
  { id: "scooter", test: (n) => hasWord(n, "scooter"), text: "Scooter. How much is the fish?" },
  { id: "aerzte", test: (n) => hasAny(n, ["arzte", "aerzte", "farin"]), text: "Die Ärzte. Zu spät, zu früh, egal." },
  { id: "hosen", test: (n) => hasAny(n, ["campino", "hosen"]), text: "Tage wie diese. Nur ohne Stadion." },
  { id: "sido", test: (n) => hasWord(n, "sido"), text: "Sido. Mein Block, deine Zeitlinie." },
  { id: "apache", test: (n) => hasWord(n, "apache"), text: "Apache. Roller bleibt in 2020." },
  { id: "fox", test: (n) => n === "peter fox" || (hasWord(n, "peter") && hasWord(n, "fox")), text: "Peter Fox. Haus am See, Karte am Strahl." },
  { id: "seeed", test: (n) => hasWord(n, "seeed"), text: "Seeed. Ding, aber das Jahr." },
  { id: "cro", test: (n) => hasWord(n, "cro"), text: "Cro. Easy, das Jahr nicht." },
  { id: "rick", test: (n) => hasAny(n, ["rick", "astley"]), text: "Never gonna give you up." },
  { id: "hitster", test: (n) => n.includes("hitster"), text: "Wir kennen uns nicht." },
  { id: "grok", test: (n) => hasWord(n, "grok"), text: "Ich bin nur der Beifahrer." },
  { id: "jahrgang", test: (n) => hasWord(n, "jahrgang"), text: "Sehr witzig. Setz dich." },
  { id: "linopix", test: (n) => hasWord(n, "linopix"), text: "Der Hausherr. Hehe." },
  { id: "dj", test: (n) => n === "dj" || hasWord(n, "dj"), text: "DJ. Kopfhörer an, Meinung aus." },
  { id: "admin", test: (n) => hasWord(n, "admin"), text: "Rechte entzogen. Du rätst trotzdem." },
  { id: "host", test: (n) => hasWord(n, "host"), text: "Der Host hostet sich selbst." },
  { id: "alexa", test: (n) => hasWord(n, "alexa"), text: "Alexa, spiel Jahrgang." },
  { id: "alex", test: (n) => hasWord(n, "alex"), text: "Alex. Nicht Alexa. Na gut, fast." },
  { id: "sam", test: (n) => hasWord(n, "sam"), text: "Play it again, Sam." },
  { id: "kim", test: (n) => hasWord(n, "kim"), text: "Kim. Kardashian oder Wilde? Beides legt später." },
  { id: "nicki", test: (n) => hasAny(n, ["nicki", "minaj"]), text: "Nicki. Super bass, super spät." },
];

export function notePlayerName(name: string) {
  window.clearTimeout(nameTimer);
  nameTimer = window.setTimeout(() => {
    const n = fold(name);
    if (n.length < 2) return;
    for (const gag of NAME_GAGS) {
      if (said.has(gag.id)) continue;
      if (gag.test(n) && onceGag(gag.id, gag.text)) return;
    }
  }, 480);
}

export function noteRoomCode(code: string) {
  const id = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  if (id.length < 4) return;
  if (id === "ABBA") onceGag("c-abba", "Thank you for the music.");
  else if (id === "BEEF") onceGag("c-beef", "Wellerman bleibt im Hafen.");
  else if (id === "LOVE") onceGag("c-love", "All you need is years.");
  else if (id === "YEAH") onceGag("c-yeah", "Yeah! Die 70er nicken.");
  else if (id === "ROCK") onceGag("c-rock", "We will, we will… einordnen.");
  else if (id === "DISC") onceGag("c-disc", "Disco, disco, das Jahr.");
  else if (id === "YEAR") onceGag("c-year", "Jahrgang. Sehr auf der Nase.");
  else if (id === "1984") onceGag("c-1984", "Orwell legt auf. Du ordnest ein.");
  else if (id === "2000") onceGag("c-2000", "Party like it's 1999. Fast.");
  else if (id === "GAGA") onceGag("c-gaga", "Bad Romance mit dem Code.");
  else if (id === "RICK") onceGag("c-rick", "Never gonna give you up.");
  else if (id === "NENA") onceGag("c-nena", "99 Luftballons, ein Code.");
  else if (id === "BABY") onceGag("c-baby", "Baby one more time. Eine Runde noch.");
  else if (id === "KING") onceGag("c-king", "Elvis hat das Gebäude verlassen.");
  else if (id === "BEAT") onceGag("c-beat", "Beatle oder Beat? Beides liegt links.");
}

export function notePack(id: EraId) {
  if (id === "party") onceGag("p-party", "Bitte nicht die Nachbarn.");
  else if (id === "classic") onceGag("p-classic", "Die Eltern nicken. Die Kinder googeln.");
  else if (id === "eighties") onceGag("p-80", "Schultern an, Haare hoch.");
  else if (id === "nineties") onceGag("p-90", "Niemand braucht das Internet. Außer die Vorschau.");
  else if (id === "mix") onceGag("p-mix", "DJ hat frei. Du mischst.");
  else if (id === "playlist") onceGag("p-list", "Fremde Hits, eigene Schuld.");
}

export function noteVariant(id: PlayVariant) {
  if (id === "wild") onceGag("v-wild", "Die Platte läuft verkehrt. Du auch?");
  else if (id === "custom") onceGag("v-custom", "Grenzen? Welche Grenzen?");
  else if (id === "blind") onceGag("v-blind", "Augen zu, Ohren auf.");
  else if (id === "hook") onceGag("v-hook", "Nur der Titel. Der Rest ist Einbildung.");
}

export function noteChat(text: string) {
  const key = fold(text).replace(/\s+/g, "");
  if (key === "schweinebein") {
    onceGag(
      "schweinebein",
      "Neues Emote: Schweinebein. Links bei den Reaktionen.",
    );
  }
}
