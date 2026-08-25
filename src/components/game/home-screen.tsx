import { Disc3, Radio, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { unlockAudio } from "@/lib/game/audio";

export function HomeScreen() {
  const openSetup = useGame((s) => s.openSetup);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const openEntry = useOnline((s) => s.openEntry);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-between px-5 py-8 sm:py-12">
      <header className="stagger-in flex flex-col items-center text-center">
        <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">
          Musik-Zeitspiel
        </p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-fg sm:text-7xl">
          Jahrgang
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base text-muted sm:text-lg">
          Hits hören und auf die Zeitlinie legen. Zeitstrahl nach Jahr, Original
          mit Interpret und Titel.
        </p>
      </header>

      <div className="flex justify-center py-10">
        <Vinyl size="lg" spinning />
      </div>

      <div className="stagger-in mx-auto flex w-full max-w-sm flex-col gap-3">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            unlockAudio();
            openEntry();
          }}
        >
          <Radio className="size-4" />
          Online-Abend
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => {
            unlockAudio();
            openSetup("party");
          }}
        >
          <Users className="size-4" />
          Ein Bildschirm
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => {
            unlockAudio();
            openSetup("solo");
          }}
        >
          <User className="size-4" />
          Alleine spielen
        </Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={() => setRulesOpen(true)}>
          <Disc3 className="size-4" />
          Spielregeln
        </Button>
      </div>
    </main>
  );
}
