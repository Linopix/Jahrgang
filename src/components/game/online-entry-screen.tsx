import { useState } from "react";
import { ChevronLeft, Monitor, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { sfxTick, unlockAudio } from "@/lib/game/audio";
import { useOnline } from "@/lib/game/online-store";
import { notePlayerName, noteRoomCode } from "@/lib/gags";
import { TV_LIVE } from "@/lib/tv/flags";
import { TV_MODE_NAME } from "@/lib/tv/names";
import { isBlocked } from "@/lib/game/moderation";
import { enterBigscreen } from "@/lib/tv/fullscreen";
import { cn } from "@/lib/utils";

export function OnlineEntryScreen() {
  const selfName = useOnline((s) => s.selfName);
  const inviteCode = useOnline((s) => s.inviteCode);
  const error = useOnline((s) => s.error);
  const setSelfName = useOnline((s) => s.setSelfName);
  const setInviteCode = useOnline((s) => s.setInviteCode);
  const createRoom = useOnline((s) => s.createRoom);
  const joinRoom = useOnline((s) => s.joinRoom);
  const leaveRoom = useOnline((s) => s.leaveRoom);
  const claimIntent = useOnline((s) => s.claimIntent);
  const [tv, setTv] = useState(false);

  const named = selfName.trim().length > 0 && !isBlocked(selfName);
  const canOpenTv = TV_LIVE && tv;
  const canOpenRoom = canOpenTv || named;

  function openRoom() {
    unlockAudio();
    createRoom(canOpenTv ? { tv: true } : undefined);
    if (canOpenTv) enterBigscreen();
  }

  function join() {
    unlockAudio();
    joinRoom(undefined, claimIntent ? { claim: true } : undefined);
  }

  return (
    <main className="screen-in mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 lg:max-w-5xl lg:justify-center lg:px-8">
      <button
        type="button"
        onClick={() => leaveRoom()}
        className="back-link"
      >
        <ChevronLeft className="size-4" />
        Zurück
      </button>

      <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,28rem)_auto] lg:items-start lg:gap-16">
      <div>
      <header className="mt-6 lg:mt-0">
        <p className="text-xs font-medium tracking-[0.24em] text-muted uppercase">Mehrspieler</p>
        <h1 className="mt-2 font-display text-4xl font-medium text-fg">
          {claimIntent ? "Host-Handy" : "Online-Abend"}
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {claimIntent
            ? "Name eintragen und beitreten. Du stellst Pack und Start ein. Die Bühne bleibt das Übertragungsgerät."
            : "Ein Host öffnet den Raum. Mitspieler treten mit Code oder Einladungslink bei, jedes Gerät für sich."}
        </p>
      </header>

      <div className="flex justify-center py-8 lg:hidden">
        <Vinyl size="sm" spinning />
      </div>

      {tv && inviteCode.length < 4 ? null : (
      <label className="mt-6 block">
        <span className="text-sm font-medium text-fg">Dein Name</span>
        <input
          value={selfName}
          onChange={(event) => {
            setSelfName(event.target.value);
            notePlayerName(event.target.value);
          }}
          placeholder="Name"
          maxLength={18}
          autoComplete="nickname"
          className="mt-2 h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none transition-[box-shadow] focus:ring-2 focus:ring-primary/70"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (inviteCode.length >= 4 && named) join();
            else if (canOpenRoom) openRoom();
          }}
        />
        {selfName.trim() && isBlocked(selfName) ? (
          <p className="mt-2 text-sm text-muted">Der Name geht so nicht.</p>
        ) : null}
      </label>
      )}

      {TV_LIVE && !claimIntent ? (
        <button
          type="button"
          role="switch"
          aria-checked={tv}
          onClick={() => {
            setTv((value) => !value);
            sfxTick();
          }}
          className="mt-5 flex min-h-12 w-full items-center justify-between gap-4 py-2 text-left"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm text-fg">
              <Monitor className="size-4" />
              {TV_MODE_NAME}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              Dieser Bildschirm zeigt die Runde im Vollbild. Legen und Raten passieren auf den anderen
              Geräten. Die Bühne braucht keinen Spielernamen. Geeignet für Fernseher und Discord-Übertragung.
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "relative h-7 w-11 shrink-0 overflow-hidden rounded-full transition-colors duration-200 ease-soft motion-reduce:transition-none",
              tv ? "bg-primary" : "bg-surface shadow-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full transition-transform duration-200 ease-soft motion-reduce:transition-none",
                tv ? "translate-x-4 bg-primary-fg" : "bg-fg",
              )}
            />
          </span>
        </button>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {claimIntent ? null : (
      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!canOpenRoom}
        onClick={openRoom}
      >
        {tv ? <Monitor className="size-4" /> : <Radio className="size-4" />}
        {tv ? `${TV_MODE_NAME} öffnen` : "Raum öffnen"}
      </Button>
      )}

      {claimIntent ? null : (
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-[0.18em] text-subtle uppercase">oder beitreten</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      )}

      <label className="mt-6 block">
        <span className="text-sm font-medium text-fg">Code oder Link</span>
        <input
          value={inviteCode}
          onChange={(event) => {
            setInviteCode(event.target.value);
            noteRoomCode(event.target.value);
          }}
          placeholder="K7M2"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-2 h-12 w-full rounded-md bg-raised px-4 font-mono text-lg tracking-[0.28em] text-fg uppercase shadow-border outline-none focus:ring-2 focus:ring-primary/70"
          onKeyDown={(event) => {
            if (event.key !== "Enter" || !named || inviteCode.length < 4) return;
            event.preventDefault();
            join();
          }}
        />
      </label>

      <Button
        size="lg"
        variant={claimIntent ? undefined : "secondary"}
        className="mt-4 w-full"
        disabled={!named || inviteCode.length < 4}
        onClick={join}
      >
        {claimIntent ? "Host werden" : "Beitreten"}
      </Button>
      </div>

      <div className="hidden lg:flex lg:items-center lg:justify-center lg:pt-10">
        <Vinyl size="lg" spinning />
      </div>
      </div>
    </main>
  );
}
