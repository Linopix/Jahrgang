import { create } from "zustand";

export type AccountUser = { id: string; name: string };

type AccountStore = {
  user: AccountUser | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  submit: (op: "register" | "login", name: string, secret: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

async function parse(res: Response) {
  try {
    return (await res.json()) as { user?: AccountUser | null; error?: string };
  } catch {
    return { error: "Netz" };
  }
}

export const useAccount = create<AccountStore>((set) => ({
  user: null,
  loading: true,
  error: null,
  hydrate: async () => {
    try {
      const res = await fetch("/api/account", { credentials: "include" });
      const body = await parse(res);
      set({ user: body.user ?? null, loading: false, error: null });
    } catch {
      set({ user: null, loading: false });
    }
  },
  submit: async (op, name, secret) => {
    set({ error: null });
    const res = await fetch("/api/account", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op, name, secret }),
    });
    const body = await parse(res);
    if (!res.ok || !body.user) {
      set({ error: body.error || "Das hat nicht geklappt." });
      return false;
    }
    set({ user: body.user, error: null });
    return true;
  },
  logout: async () => {
    await fetch("/api/account", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "logout" }),
    });
    set({ user: null });
  },
}));

export function submitBoard(row: {
  wins: number;
  points: number;
  heard: number;
  placedOk: number;
  variant: string;
}) {
  return fetch("/api/scores", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(row),
  }).catch(() => {});
}
