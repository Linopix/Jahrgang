import { create } from "zustand";

export type DiscordUser = {
  id: string;
  username: string;
  avatar: string | null;
};

type DiscordStore = {
  ready: boolean;
  oauth: boolean;
  user: DiscordUser | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  connect: () => void;
  logout: () => Promise<void>;
};

export const useDiscord = create<DiscordStore>((set, get) => ({
  ready: false,
  oauth: false,
  user: null,
  loading: true,
  hydrate: async () => {
    try {
      const res = await fetch("/api/discord/me", { credentials: "include" });
      const body = (await res.json()) as {
        oauth?: boolean;
        clientId?: string | null;
        user?: DiscordUser | null;
      };
      if (body.clientId) {
        (window as Window & { __DISCORD_CLIENT_ID__?: string }).__DISCORD_CLIENT_ID__ = body.clientId;
      }
      set({
        ready: true,
        oauth: Boolean(body.oauth),
        user: body.user ?? null,
        loading: false,
      });
    } catch {
      set({ ready: true, oauth: false, user: null, loading: false });
    }
  },
  connect: () => {
    if (!get().oauth) return;
    window.location.href = "/api/discord/start";
  },
  logout: async () => {
    await fetch("/api/discord/logout", { method: "POST", credentials: "include" });
    set({ user: null });
  },
}));
