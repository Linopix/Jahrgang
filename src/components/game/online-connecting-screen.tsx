import { Button } from "@/components/ui/button";
import { Vinyl } from "./vinyl";
import { requestLeave } from "@/lib/game/online-actions";
import { useOnline } from "@/lib/game/online-store";

export function OnlineConnectingScreen() {
  const roomCode = useOnline((s) => s.roomCode);
  const claimIntent = useOnline((s) => s.claimIntent);

  return (
    <main className="screen-in flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Vinyl spinning size="md" />
      <p className="mt-8 font-mono text-3xl tracking-[0.28em] text-fg">{roomCode}</p>
      <h1 className="mt-4 font-display text-3xl font-medium text-fg">
        {claimIntent ? "Host werden" : "Verbinden"}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {claimIntent
          ? "Du meldest dich als Host am Handy an. Der Fernseher bleibt die Bühne."
          : "Verbindung zum Host wird hergestellt."}
      </p>
      <Button variant="ghost" className="mt-8" onClick={() => requestLeave()}>
        Abbrechen
      </Button>
    </main>
  );
}
