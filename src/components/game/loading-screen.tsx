import { Vinyl } from "./vinyl";
import { useGame } from "@/lib/game/store";
import { useOnline } from "@/lib/game/online-store";

export function LoadingScreen() {
  const progress = useGame((s) => s.loadProgress);
  const onlineGuest = useOnline((s) => s.status === "playing" && s.role === "guest");
  const pct = Math.round((progress.done / Math.max(progress.total, 1)) * 100);

  return (
    <main className="screen-in flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Vinyl spinning size="md" />
      <h1 className="mt-8 font-display text-3xl font-medium text-fg">Nadel setzt auf</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {onlineGuest
          ? "Der Host lädt die Titel."
          : "Songvorschauen werden geladen."}
      </p>
      {onlineGuest ? null : (
        <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-raised">
          <div
            className="h-full origin-left bg-primary transition-transform duration-200 ease-soft"
            style={{ transform: `scaleX(${Math.max(pct / 100, 0.02)})` }}
          />
        </div>
      )}
    </main>
  );
}
