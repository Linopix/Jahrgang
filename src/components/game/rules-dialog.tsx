import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Start",
    body: "Jeder bekommt eine offene Karte. Das ist der Anfang der eigenen Zeitlinie – links früh, rechts spät.",
  },
  {
    n: "02",
    title: "Hören",
    body: "Ein neuer Hit spielt. Du siehst weder Titel noch Jahr. Erkennen ist erlaubt, das Jahr musst du einordnen.",
  },
  {
    n: "03",
    title: "Legen",
    body: "Tippe den Platz vor, zwischen oder hinter deinen Karten. Du musst nicht das genaue Jahr wissen – nur, ob der Song früher oder später kommt.",
  },
  {
    n: "04",
    title: "Aufdecken",
    body: "Stimmt die Lage, bleibt die Karte. Liegt sie falsch, wandert sie weg. Gleiches Jahr darf direkt davor oder danach liegen.",
  },
  {
    n: "05",
    title: "Joker",
    body: "Zwei Joker pro Person: Jahrzehnt anzeigen oder den Song überspringen. Wer zuerst das Ziel erreicht, ist der Jahrgang.",
  },
  {
    n: "06",
    title: "Online",
    body: "Beim Online-Abend bekommt der Host einen vierstelligen Code. Den Link in Discord posten — jede Person spielt auf dem eigenen Gerät, Voice bleibt im Call.",
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
                Wie Hitster, nur ohne Kartenstapel und ohne App-Scan.
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
