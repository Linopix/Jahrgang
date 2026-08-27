import { create } from "zustand";
import {
  DEFAULT_CUSTOM,
  DEFAULT_MIX_FROM,
  DEFAULT_MIX_TO,
  DEFAULT_NEXT_ROUND,
  DEFAULT_POOL,
  DEFAULT_ROOM_CONFIG,
  DEFAULT_TARGET,
  DEFAULT_VARIANT,
  clampPool,
  clampTarget,
  defaultTokensFor,
  isEraId,
  isGenreId,
  isNextRoundPolicy,
  isPlayVariant,
  isTokenCount,
  parseCustom,
  parseEras,
  parseExtraEra,
  parseSuggest,
  parseStageAudio,
  type CustomRules,
  type EraId,
  type GenreId,
  type NextRoundPolicy,
  type PlayVariant,
  type RoomConfig,
  type StageAudio,
  type SuggestMode,
  type TokenCount,
  type GameSnapshot,
  type ResolvedSong,
} from "./types";
import {
  DEFAULT_CUP_AUDIO,
  DEFAULT_CUP_FLOW,
  DEFAULT_CUP_QUALIFY,
  DEFAULT_CUP_SIZE,
  parseCupAudio,
  parseCupFlow,
  parseCupQualify,
  parseCupSize,
  type CupAudio,
  type CupBoardCard,
  type CupFlow,
  type CupGroupSize,
  type CupQualify,
  type Tournament,
} from "@/lib/tournament";
import { TOURNAMENT_LIVE } from "@/lib/tournament/flags";
import { isBlocked, stripControls, cleanName, safeName } from "./moderation";
import { normalizePin } from "./pin";
import { TV_LIVE } from "@/lib/tv/flags";
import { TV_STAGE_NAME, type TvStep } from "@/lib/tv/names";
import { makeRoomCode, normalizeRoomCode } from "./room-code";
import { clearSeat, makePeerId, readSeat, writeSeat, type SeatRecord } from "./seat";

export type OnlineStatus = "off" | "entry" | "connecting" | "lobby" | "playing";
export type OnlineRole = "host" | "guest";

export type OnlineMember = {
  id: string;
  name: string;
  connectionState: "self" | "connecting" | "connected" | "failed" | "disconnected";
  droppedAt?: number;
};

const NAME_KEY = "jahrgang-name";

function readStoredName() {
  if (typeof window === "undefined") return "";
  try {
    return cleanName(localStorage.getItem(NAME_KEY) ?? "");
  } catch {
    return "";
  }
}

function writeStoredName(name: string) {
  if (typeof window === "undefined" || !name || isBlocked(name)) return;
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // private mode / quota
  }
}

function persistNow(state: {
  roomCode: string;
  selfId: string;
  role: OnlineRole | null;
  selfName: string;
  tv: boolean;
  adminId: string;
  hostId: string;
}) {
  if (!state.roomCode || !state.selfId || !state.role) return;
  writeSeat({
    room: state.roomCode,
    selfId: state.selfId,
    role: state.role,
    name: state.selfName,
    tv: state.tv,
    adminId: state.adminId,
    hostId: state.hostId,
    savedAt: Date.now(),
  });
}

function seatToConnecting(seat: SeatRecord) {
  return {
    status: "connecting" as const,
    role: seat.role,
    roomCode: seat.room,
    selfId: seat.selfId,
    selfName: seat.name,
    hostId: seat.hostId || (seat.role === "host" ? seat.selfId : ""),
    adminId: seat.adminId,
    tv: seat.tv,
    members: [] as OnlineMember[],
    error: null,
    pending: false,
    inviteCode: seat.room,
    kickedIds: [] as string[],
    hostLive: seat.role === "host",
    claimIntent: false,
    claimOpen: false,
    stagePlays: false,
    tvStep: seat.tv ? ("claim" as const) : ("invite" as const),
  };
}

type OnlineStore = {
  status: OnlineStatus;
  role: OnlineRole | null;
  roomCode: string;
  selfId: string;
  selfName: string;
  hostId: string;
  members: OnlineMember[];
  era: EraId;
  target: number;
  variant: PlayVariant;
  tokens: TokenCount;
  nextRound: NextRoundPolicy;
  playlistUrl: string;
  playlistLabel: string;
  mixFrom: number;
  mixTo: number;
  mixGenre: GenreId;
  custom: CustomRules;
  extraEra: EraId | null;
  eras: EraId[];
  pool: number;
  emoji: boolean;
  chat: boolean;
  tv: boolean;
  suggest: SuggestMode;
  stageAudio: StageAudio;
  cup: boolean;
  cupSize: CupGroupSize;
  cupQualify: CupQualify;
  cupFlow: CupFlow;
  cupAudio: CupAudio;
  tournament: Tournament | null;
  cupTables: Record<string, GameSnapshot>;
  cupBoards: CupBoardCard[];
  cupSpeakers: Record<string, string>;
  cupPile: ResolvedSong[];
  cupIntent: boolean;
  stagePlays: boolean;
  adminId: string;
  tvStep: TvStep;
  claimOpen: boolean;
  claimIntent: boolean;
  error: string | null;
  pending: boolean;
  inviteCode: string;
  kickedIds: string[];
  hostLive: boolean;
  roomPin: string;
  joinPin: string;
  pinNeeded: boolean;
  openEntry: (invite?: string, opts?: { claim?: boolean; cup?: boolean }) => void;
  setSelfName: (name: string) => void;
  setInviteCode: (code: string) => void;
  createRoom: (opts?: { tv?: boolean; cup?: boolean }) => void;
  joinRoom: (code?: string, opts?: { claim?: boolean }) => void;
  leaveRoom: () => void;
  resumeSeat: () => boolean;
  becomeHost: (adminId?: string) => void;
  setHostLive: (live: boolean) => void;
  setRoomPin: (pin: string) => void;
  setJoinPin: (pin: string) => void;
  persistSeat: () => void;
  setIdentity: (selfId: string, hostIfCreator: boolean) => void;
  setMembers: (members: OnlineMember[]) => void;
  setConfig: (config: RoomConfig) => void;
  setTournament: (tournament: Tournament | null) => void;
  setCupTables: (
    tables: Record<string, GameSnapshot>,
    boards?: CupBoardCard[],
    speakers?: Record<string, string>,
  ) => void;
  setCupPile: (pile: ResolvedSong[]) => void;
  setTvStep: (step: TvStep) => void;
  skipTvClaim: () => void;
  setStagePlays: (on: boolean) => void;
  setAdminId: (id: string) => void;
  setError: (error: string | null) => void;
  setPending: (pending: boolean) => void;
  markPlaying: () => void;
  markLobby: () => void;
};

export const useOnline = create<OnlineStore>((set, get) => ({
  status: "off",
  role: null,
  roomCode: "",
  selfId: "",
  selfName: "",
  hostId: "",
  members: [],
  era: DEFAULT_ROOM_CONFIG.era,
  target: DEFAULT_TARGET,
  variant: DEFAULT_VARIANT,
  tokens: DEFAULT_ROOM_CONFIG.tokens,
  nextRound: DEFAULT_NEXT_ROUND,
  playlistUrl: "",
  playlistLabel: "",
  mixFrom: DEFAULT_MIX_FROM,
  mixTo: DEFAULT_MIX_TO,
  mixGenre: "all",
  custom: DEFAULT_CUSTOM,
  extraEra: null,
  eras: ["all"],
  pool: DEFAULT_POOL,
  emoji: true,
  chat: true,
  tv: false,
  suggest: DEFAULT_ROOM_CONFIG.suggest,
  stageAudio: DEFAULT_ROOM_CONFIG.stageAudio,
  cup: false,
  cupSize: DEFAULT_CUP_SIZE,
  cupQualify: DEFAULT_CUP_QUALIFY,
  cupFlow: DEFAULT_CUP_FLOW,
  cupAudio: DEFAULT_CUP_AUDIO,
  tournament: null,
  cupTables: {},
  cupBoards: [],
  cupSpeakers: {},
  cupPile: [],
  cupIntent: false,
  stagePlays: false,
  adminId: "",
  tvStep: "invite",
  claimOpen: false,
  claimIntent: false,
  error: null,
  pending: false,
  inviteCode: "",
  kickedIds: [],
  hostLive: true,
  roomPin: "",
  joinPin: "",
  pinNeeded: false,

  openEntry: (invite, opts) => {
    const code = invite ? normalizeRoomCode(invite) : get().inviteCode;
    set({
      status: "entry",
      role: null,
      roomCode: "",
      selfId: "",
      hostId: "",
      members: [],
      error: null,
      pending: false,
      inviteCode: code,
      selfName: get().selfName.trim() || readStoredName(),
      tv: false,
      stagePlays: false,
      adminId: "",
      tvStep: "invite",
      claimOpen: false,
      claimIntent: Boolean(opts?.claim) && code.length === 4,
      cupIntent: Boolean(opts?.cup),
      cup: false,
      tournament: null,
      cupTables: {},
      cupBoards: [],
      cupSpeakers: {},
      cupPile: [],
      roomPin: "",
      pinNeeded: false,
    });
  },

  setSelfName: (name) => {
    const next = stripControls(name).slice(0, 18);
    if (next.trim() && !isBlocked(next)) writeStoredName(next.trim());
    set({ selfName: next });
  },
  setInviteCode: (code) => set({ inviteCode: normalizeRoomCode(code) }),

  createRoom: (opts) => {
    const cup = TOURNAMENT_LIVE && (Boolean(opts?.cup) || get().cupIntent);
    const tv = TV_LIVE && (Boolean(opts?.tv) || cup);
    const name = tv ? TV_STAGE_NAME : get().selfName.trim() || readStoredName();
    if (!name) {
      set({ error: "Bitte zuerst einen Namen eintragen." });
      return;
    }
    if (!tv && isBlocked(name)) {
      set({ error: "Der Name geht so nicht." });
      return;
    }
    if (!tv) writeStoredName(name);
    const roomCode = makeRoomCode();
    const selfId = makePeerId();
    set({
      status: "connecting",
      role: "host",
      roomCode,
      selfId,
      selfName: name,
      hostId: selfId,
      members: [],
      error: null,
      pending: false,
      kickedIds: [],
      tv,
      stagePlays: false,
      adminId: cup || !tv ? selfId : "",
      tvStep: cup ? "setup" : tv ? "claim" : "invite",
      claimOpen: tv && !cup,
      claimIntent: false,
      hostLive: true,
      cup,
      cupIntent: false,
      cupFlow: cup ? DEFAULT_CUP_FLOW : DEFAULT_CUP_FLOW,
      cupAudio: cup ? DEFAULT_CUP_AUDIO : DEFAULT_CUP_AUDIO,
      tournament: null,
      cupTables: {},
      cupBoards: [],
      cupSpeakers: {},
      cupPile: [],
      roomPin: "",
      pinNeeded: false,
    });
    persistNow(get());
  },

  joinRoom: (code, opts) => {
    const raw = code ?? get().inviteCode;
    const roomCode = normalizeRoomCode(raw);
    if (roomCode.length < 4) {
      set({ error: "Bitte einen vierstelligen Code oder den Einladungslink eingeben." });
      return;
    }
    const name = get().selfName.trim() || readStoredName();
    if (!name) {
      set({ error: "Bitte zuerst einen Namen eintragen." });
      return;
    }
    if (isBlocked(name)) {
      set({ error: "Der Name geht so nicht." });
      return;
    }
    writeStoredName(name);
    const selfId = readSeat(roomCode)?.selfId || makePeerId();
    set({
      status: "connecting",
      role: "guest",
      roomCode,
      selfId,
      selfName: name,
      hostId: "",
      members: [],
      error: null,
      pending: false,
      inviteCode: roomCode,
      claimIntent: Boolean(opts?.claim) || get().claimIntent,
      hostLive: true,
    });
    persistNow(get());
  },

  leaveRoom: () => {
    clearSeat();
    set({
      status: "off",
      role: null,
      roomCode: "",
      selfId: "",
      hostId: "",
      members: [],
      error: null,
      pending: false,
      kickedIds: [],
      tv: false,
      stagePlays: false,
      adminId: "",
      tvStep: "invite",
      claimOpen: false,
      claimIntent: false,
      hostLive: true,
      cup: false,
      cupIntent: false,
      tournament: null,
      cupTables: {},
      cupBoards: [],
      cupSpeakers: {},
      cupPile: [],
      roomPin: "",
      joinPin: "",
      pinNeeded: false,
    });
  },

  resumeSeat: () => {
    if (get().status !== "off" && get().status !== "entry") return false;
    const seat = readSeat();
    if (!seat) return false;
    set(seatToConnecting(seat));
    persistNow(get());
    return true;
  },

  becomeHost: (adminId) => {
    const selfId = get().selfId;
    if (!selfId) return;
    const nextAdmin = adminId || selfId;
    set({
      role: "host",
      hostId: selfId,
      adminId: nextAdmin,
      hostLive: true,
    });
    persistNow(get());
  },

  setHostLive: (live) => set({ hostLive: live }),
  setRoomPin: (pin) => set({ roomPin: normalizePin(pin) }),
  setJoinPin: (pin) => set({ joinPin: normalizePin(pin), error: null }),
  persistSeat: () => persistNow(get()),

  setIdentity: (selfId, hostIfCreator) => {
    const { role, selfName, tv, adminId } = get();
    const hostId = hostIfCreator && role === "host" ? selfId : get().hostId;
    const nextAdmin =
      adminId && adminId !== get().selfId && adminId !== selfId
        ? adminId
        : hostIfCreator && role === "host"
          ? selfId
          : adminId;
    set({
      selfId,
      hostId: hostId || get().hostId,
      adminId: nextAdmin,
      status: role === "host" ? "lobby" : get().status,
      members:
        role === "host" && get().members.length <= 1
          ? [{ id: selfId, name: tv ? TV_STAGE_NAME : safeName(selfName, "Host"), connectionState: "self" }]
          : get().members,
    });
    persistNow(get());
  },

  setMembers: (members) => set({ members }),
  setConfig: (config) => {
    const eras = parseEras(config.era, config.extraEra, config.eras);
    set({
      era: eras[0] ?? DEFAULT_ROOM_CONFIG.era,
      target: clampTarget(config.target),
      variant: isPlayVariant(config.variant) ? config.variant : DEFAULT_VARIANT,
      tokens: isTokenCount(config.tokens)
        ? config.tokens
        : defaultTokensFor(isPlayVariant(config.variant) ? config.variant : DEFAULT_VARIANT),
      nextRound: isNextRoundPolicy(config.nextRound) ? config.nextRound : DEFAULT_NEXT_ROUND,
      playlistUrl: config.playlistUrl ?? "",
      playlistLabel: config.playlistLabel ?? "",
      mixFrom: typeof config.mixFrom === "number" ? config.mixFrom : DEFAULT_MIX_FROM,
      mixTo: typeof config.mixTo === "number" ? config.mixTo : DEFAULT_MIX_TO,
      mixGenre: isGenreId(config.mixGenre) ? config.mixGenre : "all",
      custom: parseCustom(config.custom),
      extraEra: eras[1] ?? null,
      eras,
      pool: clampPool(config.pool),
      emoji: config.emoji !== false,
      chat: config.chat !== false,
      tv: TV_LIVE && Boolean(config.tv),
      suggest: parseSuggest(config.suggest),
      stageAudio: parseStageAudio(config.stageAudio),
      cup: Boolean(config.cup),
      cupSize: parseCupSize(config.cupSize),
      cupQualify: parseCupQualify(config.cupQualify),
      cupFlow: parseCupFlow(config.cupFlow),
      cupAudio: parseCupAudio(config.cupAudio, parseCupFlow(config.cupFlow)),
      tournament: config.cup ? get().tournament : null,
      cupPile:
        config.cup &&
        get().era === config.era &&
        get().playlistUrl === (config.playlistUrl ?? "") &&
        get().mixFrom === config.mixFrom &&
        get().mixTo === config.mixTo &&
        get().mixGenre === config.mixGenre &&
        JSON.stringify(get().eras) === JSON.stringify(eras)
          ? get().cupPile
          : [],
    });
  },
  setTournament: (tournament) => set({ tournament }),
  setCupTables: (tables, boards, speakers) =>
    set({
      cupTables: tables,
      ...(boards ? { cupBoards: boards } : {}),
      ...(speakers ? { cupSpeakers: speakers } : {}),
    }),
  setCupPile: (pile) => set({ cupPile: Array.isArray(pile) ? pile : [] }),
  setTvStep: (step) => set({ tvStep: step }),
  skipTvClaim: () => {
    if (!get().claimOpen) return;
    const selfId = get().selfId;
    set({
      claimOpen: false,
      tvStep: "setup",
      adminId: selfId || get().adminId,
      stagePlays: true,
    });
  },
  setStagePlays: (on) => set({ stagePlays: Boolean(on) }),
  setAdminId: (id) => set({ adminId: id, claimOpen: false }),
  setError: (error) => set({ error, pending: false }),
  setPending: (pending) => set({ pending }),
  markPlaying: () => set({ status: "playing", pending: false, error: null }),
  markLobby: () => set({ status: "lobby", pending: false }),
}));

export function roomConfigFrom(
  state: Pick<
    OnlineStore,
    | "era"
    | "target"
    | "variant"
    | "tokens"
    | "nextRound"
    | "playlistUrl"
    | "playlistLabel"
    | "mixFrom"
    | "mixTo"
    | "mixGenre"
    | "custom"
    | "extraEra"
    | "eras"
    | "pool"
    | "emoji"
    | "chat"
    | "tv"
    | "suggest"
    | "stageAudio"
    | "cup"
    | "cupSize"
    | "cupQualify"
    | "cupFlow"
    | "cupAudio"
  >,
): RoomConfig {
  const cupFlow = parseCupFlow(state.cupFlow);
  return {
    era: state.era,
    target: state.target,
    variant: state.variant,
    tokens: state.tokens,
    nextRound: state.nextRound,
    playlistUrl: state.playlistUrl,
    playlistLabel: state.playlistLabel,
    mixFrom: state.mixFrom,
    mixTo: state.mixTo,
    mixGenre: state.mixGenre,
    custom: parseCustom(state.custom),
    extraEra: parseExtraEra(state.extraEra, state.era),
    eras: parseEras(state.era, state.extraEra, state.eras),
    pool: clampPool(state.pool),
    emoji: state.emoji !== false,
    chat: state.chat !== false,
    tv: TV_LIVE && Boolean(state.tv),
    suggest: parseSuggest(state.suggest),
    stageAudio: parseStageAudio(state.stageAudio),
    cup: Boolean(state.cup),
    cupSize: parseCupSize(state.cupSize),
    cupQualify: parseCupQualify(state.cupQualify),
    cupFlow,
    cupAudio: parseCupAudio(state.cupAudio, cupFlow),
  };
}

export function isMyTurn(selfId: string, currentPlayerId: string | undefined) {
  if (!selfId || !currentPlayerId) return true;
  return selfId === currentPlayerId;
}
