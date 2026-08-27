import type { TvStep } from "@/lib/tv/names";
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
  target: number;
  variant: PlayVariant;
  tokens: TokenCount;
  nextRound: NextRoundPolicy;
  playlistUrl?: string;
  playlistLabel?: string;
  mixFrom?: number;
  mixTo?: number;
  mixGenre?: GenreId;
  custom?: CustomRules;
  extraEra?: EraId | null;
  eras?: EraId[];
  pool?: number;
  emoji?: boolean;
  chat?: boolean;
  tv?: boolean;
  stagePlays?: boolean;
};

export type OnlineMessage =
  | { t: "hello"; name: string; claim?: boolean; resume?: boolean }
  | ({ t: "lobby"; hostId: string; adminId?: string; tvStep?: TvStep; members: MemberWire[] } & RoomConfigWire)
  | ({ t: "config" } & RoomConfigWire)
  | { t: "loading" }
  | { t: "start-failed"; error: string }
  | { t: "state"; snapshot: GameSnapshot }
  | {
      t: "action";
      kind: "place" | "decade" | "skip" | "next" | "end";
      slot?: number;
      title?: string;
      artist?: string;
    }
  | { t: "again" }
  | { t: "back-lobby" }
  | { t: "host-left" }
  | { t: "host-take"; hostId: string; adminId?: string }
  | { t: "sync-request" }
  | { t: "evening" }
  | { t: "aim"; slot: number | null }
  | { t: "react"; emoji: string }
  | { t: "chat"; text: string; id?: string }
  | { t: "chat-del"; id: string }
  | { t: "kick" }
  | { t: "admin-start" }
  | { t: "admin-kick"; id: string }
  | { t: "pass-admin"; id: string }
  | { t: "tv-step"; step: TvStep };

const KINDS = new Set([
  "hello",
  "lobby",
  "config",
  "loading",
  "start-failed",
  "state",
  "action",
  "again",
  "back-lobby",
  "host-left",
  "host-take",
  "sync-request",
  "evening",
  "aim",
  "react",
  "chat",
  "chat-del",
  "kick",
  "admin-start",
  "admin-kick",
  "pass-admin",
  "tv-step",
]);

export function isOnlineMessage(data: unknown): data is OnlineMessage {
  if (!data || typeof data !== "object" || !("t" in data)) return false;
  return KINDS.has((data as { t: unknown }).t as string);
}
