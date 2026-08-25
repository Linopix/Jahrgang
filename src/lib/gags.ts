import { create } from "zustand";
import { sfxScratch, sfxWin } from "@/lib/game/audio";

export type GagToast = { id: number; text: string; disco?: boolean };

let nextId = 1;
let vinylHits = 0;
let titleHits = 0;
let konami = 0;
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
  push: (text: string, disco?: boolean) => void;
  drop: (id: number) => void;
  setDisco: (on: boolean) => void;
  setScramble: (on: boolean) => void;
};

export const useGags = create<GagStore>((set) => ({
  toasts: [],
  disco: false,
  scramble: false,
  push: (text, disco) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, text, disco }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((row) => row.id !== id) }));
    }, 2600);
  },
  drop: (id) => set((state) => ({ toasts: state.toasts.filter((row) => row.id !== id) })),
  setDisco: (on) => set({ disco: on }),
  setScramble: (on) => set({ scramble: on }),
}));

export function toastGag(text: string) {
  useGags.getState().push(text);
}

export function noteVinylClick() {
  vinylHits += 1;
  if (vinylHits < 7) return;
  vinylHits = 0;
  sfxScratch();
  toastGag("Die Nadel hängt fest.");
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
  window.setTimeout(() => useGags.getState().setScramble(false), 1400);
}

export function noteKonamiKey(key: string) {
  const expect = KONAMI[konami];
  if (key === expect || key.toLowerCase() === expect) {
    konami += 1;
    if (konami === KONAMI.length) {
      konami = 0;
      sfxWin();
      useGags.getState().setDisco(true);
      toastGag("Disco-Edit freigeschaltet. Niemand hat etwas gesehen.");
      window.setTimeout(() => useGags.getState().setDisco(false), 1800);
    }
    return;
  }
  konami = key === KONAMI[0] ? 1 : 0;
}

export function noteMixYears(from: number, to: number) {
  if (from === 1969 && to === 1969) toastGag("Ein kleiner Schritt für eine Playlist.");
}

export function notePlayerName(name: string) {
  const fold = name.trim().toLowerCase();
  if (fold.includes("hitster")) toastGag("Wir kennen uns nicht.");
  if (fold.includes("rick astley") || fold === "rick") toastGag("Never gonna give you up.");
}

export function noteRoomCode(code: string) {
  const id = code.trim().toUpperCase();
  if (id === "ABBA") toastGag("Thank you for the music.");
  if (id === "BEEF") toastGag("Wellerman bleibt im Hafen.");
}
