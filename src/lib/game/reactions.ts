import { create } from "zustand";
import { sfxReact } from "./audio";
import { netSend } from "./net";
import { useOnline } from "./online-store";
import { useGags } from "@/lib/gags";

export const REACTION_EMOJIS = ["🔥", "😂", "😱", "👏", "💯", "💀", "❤️", "🎵"] as const;
export const HIDDEN_EMOTES = ["schweinebein"] as const;
export const EMOTE_SRC: Record<(typeof HIDDEN_EMOTES)[number], string> = {
  schweinebein: "/emotes/schweinebein.png",
};

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
export type HiddenEmote = (typeof HIDDEN_EMOTES)[number];
export type ReactionId = ReactionEmoji | HiddenEmote;

export type ReactionBurst = {
  id: number;
  emoji: ReactionId;
  name: string;
  x: number;
};

export function isHiddenEmote(value: unknown): value is HiddenEmote {
  return typeof value === "string" && (HIDDEN_EMOTES as readonly string[]).includes(value);
}

export function isReactionId(value: unknown): value is ReactionId {
  return (
    (typeof value === "string" && (REACTION_EMOJIS as readonly string[]).includes(value)) ||
    isHiddenEmote(value)
  );
}

export function emoteUnlocked(id: HiddenEmote) {
  return useGags.getState().found.includes(id);
}

let nextId = 1;
let lastSentAt = 0;

type ReactionStore = {
  bursts: ReactionBurst[];
  push: (emoji: ReactionId, name: string) => void;
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
  if (!useOnline.getState().emoji) return;
  if (!isReactionId(emoji)) return;
  useReactions.getState().push(emoji, name);
  sfxReact(emoji);
}

export function sendReaction(emoji: ReactionId) {
  const online = useOnline.getState();
  if (!online.emoji || online.status === "off" || online.status === "entry") return;
  if (isHiddenEmote(emoji) && !emoteUnlocked(emoji)) return;
  const now = Date.now();
  if (now - lastSentAt < 700) return;
  lastSentAt = now;
  useReactions.getState().push(emoji, online.selfName || "Du");
  sfxReact(emoji);
  netSend({ t: "react", emoji });
}