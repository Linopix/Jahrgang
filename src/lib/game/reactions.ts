import { create } from "zustand";
import { sfxPop } from "./audio";
import { netSend } from "./net";
import { useOnline } from "./online-store";

export const REACTION_EMOJIS = ["🔥", "😂", "😱", "👏", "💯", "💀", "❤️", "🎵"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type ReactionBurst = {
  id: number;
  emoji: ReactionEmoji;
  name: string;
  x: number;
};

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return typeof value === "string" && (REACTION_EMOJIS as readonly string[]).includes(value);
}

let nextId = 1;
let lastSentAt = 0;

type ReactionStore = {
  bursts: ReactionBurst[];
  push: (emoji: ReactionEmoji, name: string) => void;
};

export const useReactions = create<ReactionStore>((set) => ({
  bursts: [],
  push: (emoji, name) => {
    const id = nextId++;
    const x = 14 + Math.random() * 72;
    set((state) => ({
      bursts: [...state.bursts.slice(-18), { id, emoji, name, x }],
    }));
    window.setTimeout(() => {
      set((state) => ({ bursts: state.bursts.filter((row) => row.id !== id) }));
    }, 1750);
  },
}));

export function receiveReaction(emoji: unknown, name: string) {
  if (!isReactionEmoji(emoji)) return;
  useReactions.getState().push(emoji, name);
  sfxPop();
}

export function sendReaction(emoji: ReactionEmoji) {
  const online = useOnline.getState();
  if (online.status === "off" || online.status === "entry") return;
  const now = Date.now();
  if (now - lastSentAt < 700) return;
  lastSentAt = now;
  useReactions.getState().push(emoji, online.selfName || "Du");
  sfxPop();
  netSend({ t: "react", emoji });
}
