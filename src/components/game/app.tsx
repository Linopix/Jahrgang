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
import { setLobbyWanted, unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { useDiscord } from "@/lib/discord/client";
import { setDiscordPresence } from "@/lib/discord/presence";
import { VARIANT_LABELS } from "@/lib/game/types";
import { shareUrl } from "@/lib/game/room-code";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const rulesOpen = useGame((s) => s.rulesOpen);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const onlineStatus = useOnline((s) => s.status);
  const onlineRole = useOnline((s) => s.role);
  const roomCode = useOnline((s) => s.roomCode);
  const members = useOnline((s) => s.members);
  const hydrateDiscord = useDiscord((s) => s.hydrate);
  const discordUser = useDiscord((s) => s.user);
  const variant = useGame((s) => s.variant);

  useEffect(() => {
    void hydrateDiscord();
  }, [hydrateDiscord]);

  useEffect(() => {
    if (discordUser && !useOnline.getState().selfName.trim()) {
      useOnline.getState().setSelfName(discordUser.username);
    }
  }, [discordUser]);

  useEffect(() => {
    const size = Math.max(1, members.filter((m) => m.connectionState !== "failed").length);
    if (onlineStatus === "lobby" || onlineStatus === "connecting") {
      void setDiscordPresence({
        details: "Lobby",
        state: roomCode ? `Raum ${roomCode}` : "Raum öffnen",
        size,
        max: 8,
        join: roomCode ? shareUrl(roomCode) : undefined,
      });
      return;
    }
    if (onlineStatus === "playing" || phase === "listen" || phase === "reveal") {
      void setDiscordPresence({
        details: VARIANT_LABELS[variant] ?? "Jahrgang",
        state: roomCode ? `Raum ${roomCode}` : "Am Spielen",
        size,
        max: 8,
        join: roomCode ? shareUrl(roomCode) : undefined,
      });
      return;
    }
    if (phase === "winner") {
      void setDiscordPresence({
        details: "Abend vorbei",
        state: "Rangliste",
        size,
        max: 8,
      });
    }
  }, [onlineStatus, phase, roomCode, members, variant]);

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

  const localPhase = onlineStatus === "off" || onlineStatus === "playing";

  return (
    <>
      <OnlineBridge />
      {onlineStatus === "entry" ? <OnlineEntryScreen /> : null}
      {onlineStatus === "connecting" && onlineRole === "guest" ? <OnlineConnectingScreen /> : null}
      {onlineStatus === "lobby" || (onlineStatus === "connecting" && onlineRole === "host") ? (
        <OnlineLobbyScreen />
      ) : null}
      {onlineStatus === "off" && phase === "home" ? <HomeScreen /> : null}
      {localPhase && phase === "setup" ? <SetupScreen /> : null}
      {localPhase && phase === "loading" ? <LoadingScreen /> : null}
      {localPhase && phase === "listen" ? <PlayScreen /> : null}
      {localPhase && phase === "reveal" ? <RevealScreen /> : null}
      {localPhase && phase === "winner" ? <WinnerScreen /> : null}
      {onlineStatus === "playing" && phase === "home" ? <LoadingScreen /> : null}
      <ReactionDock />
      <ChatDock />
      <GagLayer />
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}