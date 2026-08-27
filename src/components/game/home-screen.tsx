import { BookOpen, Radio, Trophy, User, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";
import { unlockAudio } from "@/lib/game/audio";
import { noteTitleClick, useGags } from "@/lib/gags";
import { EggTally } from "./gag-layer";
import { SpotifyConnect } from "./spotify-connect";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { TOURNAMENT_LIVE } from "@/lib/tournament/flags";
import { cn } from "@/lib/utils";
import { POOL_MAX } from "@/lib/game/types";

export function HomeScreen() {
  const openSetup = useGame((s) => s.openSetup);
  const setRulesOpen = useGame((s) => s.setRulesOpen);
  const openEntry = useOnline((s) => s.openEntry);

  const scramble = useGags((s) => s.scramble);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-6 sm:max-w-3xl sm:py-12 lg:max-w-6xl lg:px-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
      <div>
      <header className="stagger-in flex flex-col items-center text-center lg:items-start lg:text-left">
        <p className="kicker">
          Musik-Zeitspiel
        </p>
        <h1
          className={cn(
            "mt-2 font-display text-5xl font-medium tracking-tight text-fg sm:text-7xl",
            scramble && "title-scramble",
          )}
          onClick={noteTitleClick}
        >
          Jahrgang
        </h1>
        <p className="mt-3 max-w-md text-pretty text-base text-muted sm:text-lg">
          Einen Hit hören und auf die Zeitlinie legen. Am Tisch, online oder allein.
        </p>
      </header>

      <div className="stagger-in mx-auto mt-6 grid w-full max-w-sm grid-cols-2 gap-3 lg:mx-0 lg:max-w-md">
        {SPOTIFY_LIVE ? (
          <div className="col-span-2">
            <SpotifyConnect />
          </div>
        ) : null}
        <Button
          size="lg"
          className="w-full col-span-2"
          onClick={() => {
            unlockAudio();
            openEntry();
          }}
        >
          <Radio className="size-4" />
          Online-Abend
        </Button>
        {TOURNAMENT_LIVE ? (
          <Button
            size="lg"
            variant="secondary"
            className="w-full col-span-2"
            onClick={() => {
              unlockAudio();
              openEntry(undefined, { cup: true });
            }}
          >
            <Trophy className="size-4" />
            Turnier
          </Button>
        ) : null}
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
        <Button
          size="lg"
          variant="secondary"
          className="w-full col-span-2"
          onClick={() => setRulesOpen(true)}
        >
          <BookOpen className="size-4" />
          Regeln
        </Button>
      </div>
      </div>

      <div className="flex justify-center py-6 transition-transform duration-200 ease-soft hover:scale-[1.03] max-[640px]:py-4 lg:py-0">
        <Vinyl size="lg" spinning />
      </div>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-subtle lg:mt-10 lg:text-left">
        Eine Runde nimmt höchstens {POOL_MAX} Titel. Im Turnier kommt das ganze Pack in den Stapel.
        Ohne Hörprobe fällt ein Titel beim Start weg.{" "}
        <Link to="/hinweise" hash="hoerproben" className="text-muted transition-colors duration-150 ease-out hover:text-fg">
          Mehr unter Hinweise
        </Link>
        .
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-subtle lg:justify-start lg:text-left">
        <Link to="/hinweise" className="transition-colors duration-150 ease-out hover:text-fg">
          Hinweise
        </Link>
        <span>·</span>
        <a href="mailto:jahrgang.game@icloud.com" className="transition-colors duration-150 ease-out hover:text-fg">
          Kontakt
        </a>
        <span>·</span>
        <EggTally className="hover:text-fg" />
      </p>
    </main>
  );
}
