import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Start",
    body: "Jede Person erhält eine offene Karte als Beginn der Zeitlinie. Links steht früher, rechts später.",
  },
  {
    n: "02",
    title: "Auflegen",
    body: "Jahrgang spielt keine Musikdateien. Der Host öffnet den Titel in seinem Abo (Spotify, Apple Music, YouTube oder Deezer) und teilt den Ton, etwa in Discord. Die anderen hören mit, ohne den Namen zu sehen.",
  },
  {
    n: "03",
    title: "Legen",
    body: "Platz vor, zwischen oder hinter den Karten wählen. Im Zeitstrahl zählt nur die Lage. Im Kenner-Modus rätst du zusätzlich Interpret und Titel.",
  },
  {
    n: "04",
    title: "Aufdecken",
    body: "Stimmt die Lage, bleibt die Karte. Liegt sie falsch, wird sie zurückgelegt. Im Kenner-Modus gibt es extra Treffer für richtige Tipps. Gleiches Jahr darf direkt daneben stehen.",
  },
  {
    n: "05",
    title: "Joker",
    body: "Je nach Einstellung keine, eine oder zwei Hilfen: Jahrzehnt anzeigen oder den Titel überspringen. Wer zuerst das Ziel erreicht, gewinnt.",
  },
  {
    n: "06",
    title: "Online",
    body: "Der Host teilt einen vierstelligen Code. Repertoire und ob nur der Host oder alle die nächste Runde starten, stellt der Host in der Lobby ein.",
  },
];

type RulesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RulesDialog({ open, onOpenChange }: RulesDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="fixed inset-x-3 top-1/2 z-50 max-h-[min(36rem,calc(100dvh-2rem))] w-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-5 shadow-lift sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-medium text-fg">
                So wird gespielt
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                Zwei Varianten: Zeitstrahl und Kenner.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Schließen" className="size-10 shrink-0">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <ol className="space-y-4">
            {STEPS.map((step) => (
              <li key={step.n} className="grid grid-cols-[auto_1fr] gap-3">
                <span className="font-display text-sm tabular-nums text-subtle">{step.n}</span>
                <div>
                  <p className="font-medium text-fg">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
