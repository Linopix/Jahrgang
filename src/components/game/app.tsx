import { useEffect } from "react";
import { GagLayer } from "./gag-layer";
import { HomeScreen } from "./home-screen";
import { LoadingScreen } from "./loading-screen";
import { OnlineBridge } from "./online-bridge";
import { OnlineConnectingScreen } from "./online-connecting-screen";
import { OnlineEntryScreen } from "./online-entry-screen";
import { OnlineLobbyScreen } from "./online-lobby-screen";
import { PlayScreen } from "./play-screen";
import { ReactionDock } from "./reaction-dock";
import { RevealScreen } from "./reveal-screen";
import { RulesDialog } from "./rules-dialog";
import { SetupScreen } from "./setup-screen";
import { WinnerScreen } from "./winner-screen";
import { setLobbyWanted, unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const rulesOpen = useGame((s) => s.rulesOpen);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const onlineStatus = useOnline((s) => s.status);
  const onlineRole = useOnline((s) => s.role);

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
      <GagLayer />
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}