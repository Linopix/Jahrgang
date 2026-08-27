import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Start",
    body: "Jede Person hat eine Linie. Darauf liegt zu Beginn eine Karte, deren Jahr sichtbar ist. Standard: links früher, rechts später.",
  },
  {
    n: "02",
    title: "Hören",
    body: "Es kommt ein Titel ohne Namen und ohne Jahr. Ob Cover, Interpret oder Songtitel sichtbar sind, hängt vom Modus ab. Bei Kenner können Interpret und Titel eingegeben werden, müssen aber nicht.",
  },
  {
    n: "03",
    title: "Legen",
    body: "Die Karte wird in einen Zwischenraum der Linie gelegt. Passt das Jahr zur Sortierung, bleibt sie. Über Beenden kann die Runde vorzeitig geschlossen werden.",
  },
  {
    n: "04",
    title: "Aufdecken",
    body: "Passt das Jahr nicht, wandert die Karte unter den Stapel und kommt später erneut. Überspringen mit Joker ebenso. Zwei Titel aus demselben Jahr dürfen nebeneinander liegen. Richtige Angaben beim Raten zählen extra.",
  },
  {
    n: "05",
    title: "Joker und Ziel",
    body: "Joker: Jahrzehnt anzeigen oder den aktuellen Titel überspringen. Kenner startet mit 0 Jokern; Interpret und Titel beide richtig bringen einen Joker und das Cover. Standardziel sind 10 Karten auf der Linie. Custom kann ohne Ziel bis zum leeren Stapel gespielt werden.",
  },
  {
    n: "06",
    title: "Online",
    body: "Der Host vergibt einen vierstelligen Code. Der Host stellt in der Lobby ein, wer die nächste Runde startet und ob Chat und Emoji an sind. Falscher Anzeigename: rauswerfen und neu beitreten.",
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
                Kenner, Zeitstrahl, Blind, Star, Titel, Verrückter oder Custom.
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
