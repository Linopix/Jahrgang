import { Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { unlockAudio } from "@/lib/game/audio";
import { useOnline } from "@/lib/game/online-store";

export function OnlineEntryScreen() {
  const selfName = useOnline((s) => s.selfName);
  const inviteCode = useOnline((s) => s.inviteCode);
  const error = useOnline((s) => s.error);
  const setSelfName = useOnline((s) => s.setSelfName);
  const setInviteCode = useOnline((s) => s.setInviteCode);
  const createRoom = useOnline((s) => s.createRoom);
  const joinRoom = useOnline((s) => s.joinRoom);
  const leaveRoom = useOnline((s) => s.leaveRoom);

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 lg:max-w-5xl lg:justify-center lg:px-8">
      <button
        type="button"
        onClick={() => leaveRoom()}
        className="self-start text-sm text-muted transition-colors hover:text-fg"
      >
        Zurück
      </button>

      <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,28rem)_auto] lg:items-start lg:gap-16">
      <div>
      <header className="mt-6 lg:mt-0">
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Mehrspieler</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg">Online-Abend</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          Ein Host öffnet den Raum. Mitspieler treten mit Code oder Einladungslink bei, jedes Gerät
          für sich.
        </p>
      </header>

      <div className="flex justify-center py-8 lg:hidden">
        <Vinyl size="sm" spinning />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-fg">Dein Name</span>
        <input
          value={selfName}
          onChange={(event) => setSelfName(event.target.value)}
          placeholder="Name"
          maxLength={18}
          autoComplete="nickname"
          className="mt-2 h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] focus:ring-2 focus:ring-primary/70"
        />
      </label>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          unlockAudio();
          createRoom();
        }}
      >
        <Radio className="size-4" />
        Raum öffnen
      </Button>

      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-[0.18em] text-subtle uppercase">oder beitreten</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-fg">Code oder Link</span>
        <input
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          placeholder="K7M2"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-2 h-12 w-full rounded-md bg-raised px-4 font-mono text-lg tracking-[0.28em] text-fg uppercase shadow-border outline-none focus:ring-2 focus:ring-primary/70"
        />
      </label>

      <Button
        size="lg"
        variant="secondary"
        className="mt-4 w-full"
        disabled={inviteCode.length < 4}
        onClick={() => {
          unlockAudio();
          joinRoom();
        }}
      >
        Beitreten
      </Button>
      </div>

      <div className="hidden lg:flex lg:items-center lg:justify-center lg:pt-10">
        <Vinyl size="lg" spinning />
      </div>
      </div>
    </main>
  );
}
