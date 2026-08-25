import { Disc3, Radio, User, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-5 py-8 sm:max-w-3xl sm:py-12 lg:max-w-6xl lg:justify-center lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
      <div>
      <header className="stagger-in flex flex-col items-center text-center lg:items-start lg:text-left">
        <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">
          Musik-Zeitspiel
        </p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-fg sm:text-7xl">
          Jahrgang
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base text-muted sm:text-lg">
          Hits hören und auf die Zeitlinie legen. Zeitstrahl nach Jahr, Kenner
          mit Interpret und Titel.
        </p>
      </header>

      <div className="stagger-in mx-auto mt-8 grid w-full max-w-sm grid-cols-1 gap-3 lg:mx-0 lg:max-w-md sm:grid-cols-2 lg:grid-cols-2">
        <Button
          size="lg"
          className="w-full sm:col-span-2"
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
        <Button size="lg" variant="ghost" className="w-full sm:col-span-2" onClick={() => setRulesOpen(true)}>
          <Disc3 className="size-4" />
          Spielregeln
        </Button>
      </div>
      </div>

      <div className="flex justify-center py-10 lg:py-0">
        <Vinyl size="lg" spinning />
      </div>
      </div>
      <p className="mt-8 text-center text-xs text-subtle lg:mt-10 lg:text-left">
        <Link to="/hinweise" className="hover:text-fg">
          Hinweise
        </Link>
        <span className="mx-2">·</span>
        <a href="mailto:jahrgang.game@icloud.com" className="hover:text-fg">
          Kontakt
        </a>
      </p>
    </main>
  );
}
