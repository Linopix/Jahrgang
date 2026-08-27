import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Start",
    body: "Jeder fängt mit einer offenen Karte an. Links ist früher, rechts später.",
  },
  {
    n: "02",
    title: "Hören",
    body: "Es kommt ein neuer Titel, ohne Namen und ohne Jahr. Je nach Modus siehst du das Cover oder nicht. Bei Kenner darfst du Interpret und Titel tippen — musst du aber nicht.",
  },
  {
    n: "03",
    title: "Legen",
    body: "Du suchst den Platz auf deiner Linie. Sitzt das Jahr, bleibt die Karte. Über Beenden kannst du den Abend vorzeitig schließen und den Stand sehen.",
  },
  {
    n: "04",
    title: "Aufdecken",
    body: "Liegt sie falsch, geht sie zurück. Richtige Tipps beim Raten zählen extra. Zwei Titel aus demselben Jahr dürfen nebeneinander liegen.",
  },
  {
    n: "05",
    title: "Joker",
    body: "Jahrzehnt anzeigen oder den Titel überspringen, je nachdem wie viele Joker ihr eingestellt habt. Kenner startet ohne, ein Joker kommt dazu wenn Interpret und Titel sitzen. Wer zuerst die Linie voll hat, gewinnt. Bei Custom könnt ihr auch ohne Ziel bis zum leeren Stapel spielen.",
  },
  {
    n: "06",
    title: "Online",
    body: "Der Host schickt einen vierstelligen Code. Falscher Name: rauswerfen und neu beitreten. Wer die nächste Runde starten darf und ob Chat und Emoji an sind, stellt der Host in der Lobby ein.",
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
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-bg/80" />
        <Dialog.Content className="dialog-panel fixed inset-x-3 top-1/2 z-50 max-h-[min(36rem,calc(100dvh-2rem))] w-auto max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-5 shadow-lift sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-medium text-fg">
                So wird gespielt
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                Zeitstrahl, Blind, Kenner, Star, Titel, Verrückter oder Custom.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Schließen" className="size-10 shrink-0">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <ol className="stagger-in space-y-4">
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
