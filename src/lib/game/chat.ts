import { create } from "zustand";
import { sfxTick } from "./audio";
import { netSend } from "./net";
import { useOnline } from "./online-store";
import { noteChat } from "@/lib/gags";
import { isAdmin } from "@/lib/tv/mode";
import { cleanMessage, safeName } from "./moderation";

export const CHAT_MAX = 140;

export type ChatLine = {
  id: string;
  from: string;
  name: string;
  text: string;
  self: boolean;
};

let localSeq = 1;
let lastSentAt = 0;

function localId() {
  return `local-${localSeq++}`;
}

function wireId(selfId: string) {
  return `${selfId || "me"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

type ChatStore = {
  lines: ChatLine[];
  unread: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  push: (line: Omit<ChatLine, "id"> & { id?: string }) => string;
  remove: (id: string) => void;
  reset: () => void;
};

export const useChat = create<ChatStore>((set, get) => ({
  lines: [],
  unread: 0,
  open: false,
  setOpen: (open) => set({ open, unread: open ? 0 : get().unread }),
  push: (line) => {
    const id = line.id || localId();
    if (get().lines.some((row) => row.id === id)) return id;
    set((state) => ({
      lines: [
        ...state.lines.slice(-80),
        { id, from: line.from, name: line.name, text: line.text, self: line.self },
      ],
      unread: state.open || line.self ? 0 : state.unread + 1,
    }));
    return id;
  },
  remove: (id) => {
    set((state) => ({ lines: state.lines.filter((row) => row.id !== id) }));
  },
  reset: () => set({ lines: [], unread: 0, open: false }),
}));

export function cleanChat(input: string) {
  return cleanMessage(input, CHAT_MAX);
}

export function sendChat(raw: string) {
  const online = useOnline.getState();
  if (!online.chat || online.status === "off" || online.status === "entry") return false;
  const now = Date.now();
  if (now - lastSentAt < 600) return false;
  lastSentAt = now;
  const text = cleanChat(raw);
  if (!text) {
    if (raw.trim()) {
      useChat.getState().push({
        from: "",
        name: "",
        text: "Die Nachricht geht so nicht.",
        self: false,
      });
    }
    return false;
  }
  const id = wireId(online.selfId);
  useChat.getState().push({
    id,
    from: online.selfId,
    name: safeName(online.selfName, "Du"),
    text,
    self: true,
  });
  sfxTick();
  if (noteChat(text)) {
    useChat.getState().push({ from: "", name: "", text: "du schweinebein", self: false });
    useChat.getState().setOpen(true);
  }
  netSend({ t: "chat", text, id });
  return true;
}

export function receiveChat(raw: unknown, name: string, from: string, id?: string) {
  if (!useOnline.getState().chat) return;
  if (typeof raw !== "string") return;
  const text = cleanChat(raw);
  if (!text) return;
  const lineId = typeof id === "string" && id.trim() ? id.trim().slice(0, 64) : `${from}-${text}`;
  useChat.getState().push({
    id: lineId,
    from,
    name: safeName(name, "Gast"),
    text,
    self: false,
  });
  sfxTick();
  if (noteChat(text)) {
    useChat.getState().push({ from: "", name: "", text: "du schweinebein", self: false });
    useChat.getState().setOpen(true);
  }
}

export function deleteChat(id: string) {
  if (!isAdmin()) return;
  const line = useChat.getState().lines.find((row) => row.id === id);
  if (!line || line.self || !line.from) return;
  useChat.getState().remove(id);
  netSend({ t: "chat-del", id });
}

export function applyChatDelete(id: string, from: string) {
  const online = useOnline.getState();
  const admin = online.adminId || online.hostId;
  if (!admin || from !== admin) return;
  useChat.getState().remove(id);
}
