import { useEffect } from "react";
import { GagLayer } from "./gag-layer";
import { HomeScreen } from "./home-screen";
import { LoadingScreen } from "./loading-screen";
import { OnlineBridge } from "./online-bridge";
import { OnlineConnectingScreen } from "./online-connecting-screen";
import { OnlineEntryScreen } from "./online-entry-screen";
import { OnlineLobbyScreen } from "./online-lobby-screen";
import { PlayScreen } from "./play-screen";
import { ChatDock } from "./chat-dock";
import { ReactionDock } from "./reaction-dock";
import { RevealScreen } from "./reveal-screen";
import { RulesDialog } from "./rules-dialog";
import { SetupScreen } from "./setup-screen";
import { WinnerScreen } from "./winner-screen";
import { TvPlayScreen, TvRevealScreen, TvWinnerScreen, TvCupGridScreen, BigscreenPrompt } from "./tv-stage";
import { TournamentWatch } from "./tournament-board";
import { TOURNAMENT_LIVE } from "@/lib/tournament/flags";
import { ExitScreen } from "./exit-screen";
import { DebugOverlay } from "./debug-overlay";
import { useTvScreen } from "@/lib/tv/mode";
import { setLobbyWanted, unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { setDiscordPresence } from "@/lib/discord/presence";
import { ACCOUNT_LIVE } from "@/lib/account/flags";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { useAccount } from "@/lib/account/client";
import { refreshFreshSongs } from "@/lib/game/fresh";
import { refreshNames } from "@/lib/game/names";
import { enterBigscreen } from "@/lib/tv/fullscreen";
import { VARIANT_LABELS } from "@/lib/game/types";
import { shareUrl } from "@/lib/game/room-code";
import { useSessionExit } from "@/lib/game/session-exit";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const rulesOpen = useGame((s) => s.rulesOpen);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const onlineStatus = useOnline((s) => s.status);
  const onlineRole = useOnline((s) => s.role);
  const roomCode = useOnline((s) => s.roomCode);
  const members = useOnline((s) => s.members);
  const tv = useOnline((s) => s.tv);
  const variant = useGame((s) => s.variant);
  const hydrateAccount = useAccount((s) => s.hydrate);
  const account = useAccount((s) => s.user);
  const hydrateSpotify = useSpotify((s) => s.hydrate);
  const exitKind = useSessionExit((s) => s.kind);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (/^\/i\//i.test(url.pathname) || url.searchParams.get("room")) return;
    useOnline.getState().resumeSeat();
  }, []);

  useEffect(() => {
    if (ACCOUNT_LIVE) void hydrateAccount();
  }, [hydrateAccount]);

  useEffect(() => {
    if (SPOTIFY_LIVE) void hydrateSpotify();
  }, [hydrateSpotify]);

  useEffect(() => {
    void refreshFreshSongs();
    const id = window.setInterval(() => void refreshFreshSongs(), 12 * 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void refreshNames();
    const id = window.setInterval(() => void refreshNames(), 24 * 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (ACCOUNT_LIVE && account && !useOnline.getState().selfName.trim()) {
      useOnline.getState().setSelfName(account.name);
    }
  }, [account]);

  useEffect(() => {
    const size = Math.max(1, members.filter((m) => m.connectionState !== "failed").length);
    if (onlineStatus === "lobby" || onlineStatus === "connecting") {
      void setDiscordPresence({
        details: tv ? "Bigscreen" : "Lobby",
        state: roomCode ? `Raum ${roomCode}` : tv ? "Bühne öffnen" : "Raum öffnen",
        size,
        max: tv ? 32 : 8,
        join: roomCode ? shareUrl(roomCode) : undefined,
      });
      return;
    }
    if (onlineStatus === "playing" || phase === "listen" || phase === "reveal") {
      void setDiscordPresence({
        details: VARIANT_LABELS[variant] ?? "Jahrgang",
        state: roomCode ? `Raum ${roomCode}` : "Am Spielen",
        size,
        max: tv ? 32 : 8,
        join: roomCode ? shareUrl(roomCode) : undefined,
      });
      return;
    }
    if (phase === "winner") {
      void setDiscordPresence({
        details: "Abend vorbei",
        state: "Rangliste",
        size,
        max: tv ? 32 : 8,
      });
    }
  }, [onlineStatus, phase, roomCode, members, variant, tv]);

  const playing =
    (onlineStatus === "off" || onlineStatus === "playing") &&
    (phase === "listen" || phase === "reveal" || phase === "loading");

  useEffect(() => {
    const resume = () => unlockAudio();
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    const onVis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    setLobbyWanted(!playing);
  }, [playing]);

  const tvScreen = useTvScreen();
  const stagePlays = useOnline((s) => s.stagePlays);
  const selfId = useOnline((s) => s.selfId);
  const currentPlayerIndex = useGame((s) => s.currentPlayerIndex);
  const players = useGame((s) => s.players);
  const tvMyTurn = Boolean(tvScreen && stagePlays && selfId && players[currentPlayerIndex]?.id === selfId);
  const localPhase = onlineStatus === "off" || onlineStatus === "playing";
  const cup = useOnline((s) => s.cup);
  const cupFlow = useOnline((s) => s.cupFlow);
  const cupOn = TOURNAMENT_LIVE && cup;
  const cupPar = cupOn && cupFlow === "par";
  const watching =
    Boolean(cupOn && onlineStatus === "playing" && selfId && !tvScreen && !players.some((row) => row.id === selfId));

  useEffect(() => {
    if (!tvScreen) return;
    if (phase === "loading" || phase === "listen") enterBigscreen();
  }, [tvScreen, phase]);

  return (
    <>
      <OnlineBridge />
      {exitKind ? <ExitScreen /> : null}
      {!exitKind && onlineStatus === "entry" ? <OnlineEntryScreen /> : null}
      {!exitKind && onlineStatus === "connecting" && onlineRole === "guest" ? <OnlineConnectingScreen /> : null}
      {!exitKind && (onlineStatus === "lobby" || (onlineStatus === "connecting" && onlineRole === "host")) ? (
        <OnlineLobbyScreen />
      ) : null}
      {!exitKind && onlineStatus === "off" && phase === "home" ? <HomeScreen /> : null}
      {!exitKind && localPhase && phase === "setup" ? <SetupScreen /> : null}
      {!exitKind && localPhase && phase === "loading" ? <LoadingScreen /> : null}
      {!exitKind && localPhase && phase === "listen" ? watching ? <TournamentWatch /> : tvScreen && cupPar ? <TvCupGridScreen /> : tvScreen && !tvMyTurn ? <TvPlayScreen /> : <PlayScreen /> : null}
      {!exitKind && localPhase && phase === "reveal" ? watching ? <TournamentWatch /> : tvScreen && cupPar ? <TvCupGridScreen /> : tvScreen ? <TvRevealScreen /> : <RevealScreen /> : null}
      {!exitKind && localPhase && phase === "winner" ? tvScreen && cupPar ? <TvCupGridScreen /> : tvScreen ? <TvWinnerScreen /> : <WinnerScreen /> : null}
      {!exitKind && onlineStatus === "playing" && phase === "home" ? cupPar && tvScreen ? <TvCupGridScreen /> : <LoadingScreen /> : null}
      <ReactionDock />
      <ChatDock />
      <GagLayer />
      <DebugOverlay />
      {tvScreen ? <BigscreenPrompt /> : null}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}