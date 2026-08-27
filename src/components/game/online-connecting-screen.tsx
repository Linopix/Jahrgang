import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { requestLeave, requestSubmitPin } from "@/lib/game/online-actions";
import { useOnline } from "@/lib/game/online-store";
import { ROOM_PIN_LIVE, PIN_LEN, pinReady } from "@/lib/game/pin";

export function OnlineConnectingScreen() {
  const roomCode = useOnline((s) => s.roomCode);
  const claimIntent = useOnline((s) => s.claimIntent);
  const pinNeeded = useOnline((s) => s.pinNeeded);
  const joinPin = useOnline((s) => s.joinPin);
  const setJoinPin = useOnline((s) => s.setJoinPin);
  const error = useOnline((s) => s.error);

  return (
    <main className="screen-in flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Vinyl spinning size="md" />
      <p className="mt-8 font-mono text-3xl tracking-[0.28em] text-fg">{roomCode}</p>
      <h1 className="mt-4 font-display text-3xl font-medium text-fg">
        {pinNeeded ? "PIN" : claimIntent ? "Host werden" : "Verbinden"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {pinNeeded
          ? "Dieser Raum ist mit einer PIN geschützt. Die PIN steht nicht im Link — der Host sagt sie."
          : claimIntent
            ? "Anmeldung als Host auf diesem Gerät. Die Bühne bleibt das Übertragungsgerät."
            : "Verbindung zum Host wird hergestellt."}
      </p>
      {ROOM_PIN_LIVE && pinNeeded ? (
        <div className="mt-6 w-full max-w-xs text-left">
          <label className="block">
            <span className="text-sm font-medium text-fg">PIN</span>
            <input
              value={joinPin}
              onChange={(event) => setJoinPin(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LEN}
              className="field mt-2 font-mono text-lg tracking-[0.28em]"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !pinReady(joinPin)) return;
                event.preventDefault();
                requestSubmitPin();
              }}
            />
          </label>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={!pinReady(joinPin)}
            onClick={() => requestSubmitPin()}
          >
            Beitreten
          </Button>
        </div>
      ) : null}
      <Button variant="ghost" className="mt-8" onClick={() => requestLeave()}>
        Abbrechen
      </Button>
    </main>
  );
}
