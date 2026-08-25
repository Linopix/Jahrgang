import { create } from "zustand";
import { sfxTick } from "./audio";
import { netSend } from "./net";
import { useOnline } from "./online-store";
import { noteChat } from "@/lib/gags";

export const CHAT_MAX = 140;

export type ChatLine = {
  id: number;
  name: string;
  text: string;
  self: boolean;
};

let nextId = 1;
let lastSentAt = 0;

type ChatStore = {
  lines: ChatLine[];
  unread: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  push: (name: string, text: string, self: boolean) => void;
  reset: () => void;
};

export const useChat = create<ChatStore>((set, get) => ({
  lines: [],
  unread: 0,
  open: false,
  setOpen: (open) => set({ open, unread: open ? 0 : get().unread }),
  push: (name, text, self) => {
    const id = nextId++;
    set((state) => ({
      lines: [...state.lines.slice(-80), { id, name, text, self }],
      unread: state.open || self ? 0 : state.unread + 1,
    }));
  },
  reset: () => set({ lines: [], unread: 0, open: false }),
}));

export function cleanChat(input: string) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, CHAT_MAX);
}

export function sendChat(raw: string) {
  const online = useOnline.getState();
  if (!online.chat || online.status === "off" || online.status === "entry") return false;
  const text = cleanChat(raw);
  if (!text) return false;
  const now = Date.now();
  if (now - lastSentAt < 600) return false;
  lastSentAt = now;
  useChat.getState().push(online.selfName || "Du", text, true);
  sfxTick();
  if (noteChat(text)) {
    useChat.getState().push("", "du schweinebein", false);
    useChat.getState().setOpen(true);
  }
  netSend({ t: "chat", text });
  return true;
}

export function receiveChat(raw: unknown, name: string) {
  if (!useOnline.getState().chat) return;
  if (typeof raw !== "string") return;
  const text = cleanChat(raw);
  if (!text) return;
  useChat.getState().push(name || "Gast", text, false);
  sfxTick();
  if (noteChat(text)) {
    useChat.getState().push("", "du schweinebein", false);
    useChat.getState().setOpen(true);
  }
}
