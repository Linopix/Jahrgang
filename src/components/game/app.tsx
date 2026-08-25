import { useEffect } from "react";
import { HomeScreen } from "./home-screen";
import { LoadingScreen } from "./loading-screen";
import { PlayScreen } from "./play-screen";
import { RevealScreen } from "./reveal-screen";
import { RulesDialog } from "./rules-dialog";
import { SetupScreen } from "./setup-screen";
import { WinnerScreen } from "./winner-screen";
import { unlockAudio } from "@/lib/game/audio";
import { useGame } from "@/lib/game/store";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const rulesOpen = useGame((s) => s.rulesOpen);
  const setRulesOpen = useGame((s) => s.setRulesOpen);

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

  return (
    <>
      {phase === "home" ? <HomeScreen /> : null}
      {phase === "setup" ? <SetupScreen /> : null}
      {phase === "loading" ? <LoadingScreen /> : null}
      {phase === "listen" ? <PlayScreen /> : null}
      {phase === "reveal" ? <RevealScreen /> : null}
      {phase === "winner" ? <WinnerScreen /> : null}
      <RulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
    </>
  );
}
