import type { EraId, GameSnapshot, GenreId, PlayVariant, TokenCount } from "./types";

export type MemberWire = {
  id: string;
  name: string;
};

export type OnlineMessage =
  | {
      t: "hello";
      name: string;
    }
  | {
      t: "lobby";
      hostId: string;
      members: MemberWire[];
      era: EraId;
      target: 6 | 8 | 10;
      variant: PlayVariant;
      tokens: TokenCount;
      playlistUrl?: string;
      playlistLabel?: string;
      mixFrom?: number;
      mixTo?: number;
      mixGenre?: GenreId;
    }
  | {
      t: "config";
      era: EraId;
      target: 6 | 8 | 10;
      variant: PlayVariant;
      tokens: TokenCount;
      playlistUrl?: string;
      playlistLabel?: string;
      mixFrom?: number;
      mixTo?: number;
      mixGenre?: GenreId;
    }
  | { t: "loading" }
  | { t: "start-failed"; error: string }
  | { t: "state"; snapshot: GameSnapshot }
  | {
      t: "action";
      kind: "place" | "decade" | "skip" | "next";
      slot?: number;
      title?: string;
      artist?: string;
    }
  | { t: "back-lobby" }
  | { t: "host-left" };

export function isOnlineMessage(data: unknown): data is OnlineMessage {
  if (!data || typeof data !== "object" || !("t" in data)) return false;
  const t = (data as { t: unknown }).t;
  return (
    t === "hello" ||
    t === "lobby" ||
    t === "config" ||
    t === "loading" ||
    t === "start-failed" ||
    t === "state" ||
    t === "action" ||
    t === "back-lobby" ||
    t === "host-left"
  );
}
