import type {
  CustomRules,
  EraId,
  GameSnapshot,
  GenreId,
  NextRoundPolicy,
  PlayVariant,
  TokenCount,
} from "./types";

export type MemberWire = {
  id: string;
  name: string;
};

export type RoomConfigWire = {
  era: EraId;
  target: 6 | 8 | 10;
  variant: PlayVariant;
  tokens: TokenCount;
  nextRound: NextRoundPolicy;
  playlistUrl?: string;
  playlistLabel?: string;
  mixFrom?: number;
  mixTo?: number;
  mixGenre?: GenreId;
  custom?: CustomRules;
  emoji?: boolean;
  chat?: boolean;
};

export type OnlineMessage =
  | {
      t: "hello";
      name: string;
    }
  | ({ t: "lobby"; hostId: string; members: MemberWire[] } & RoomConfigWire)
  | ({ t: "config" } & RoomConfigWire)
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
  | { t: "again" }
  | { t: "back-lobby" }
  | { t: "host-left" }
  | { t: "react"; emoji: string }
  | { t: "chat"; text: string }
  | { t: "kick" };

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
    t === "again" ||
    t === "back-lobby" ||
    t === "host-left" ||
    t === "react" ||
    t === "chat" ||
    t === "kick"
  );
}
