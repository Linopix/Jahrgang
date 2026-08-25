import { createFileRoute } from "@tanstack/react-router";

const CONTACT = "jahrgang.game@icloud.com";

export const Route = createFileRoute("/hinweise")({
  component: HinweisePage,
});

function HinweisePage() {
  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Hinweise</h1>
      <p className="mt-3 text-sm text-muted">
        Privates Spiel, kein Gewinn, kein Label, kein offizielles Produkt.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Name</h2>
        <p className="text-sm leading-relaxed text-muted">
          Heißt Jahrgang. Nicht unter einem anderen Markennamen zeigen.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Musik</h2>
        <p className="text-sm leading-relaxed text-muted">
          Kurze Vorschauen aus den Stores. Nichts wird gespeichert. Playlists
          nur, um Titel zu finden.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Daten</h2>
        <p className="text-sm leading-relaxed text-muted">
          Ohne Konto bleibt der Stand auf dem Gerät. Räume sind nur die Leitung,
          Züge gehen Gerät zu Gerät.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Discord</h2>
        <p className="text-sm leading-relaxed text-muted">
          Voice in Discord, Spiel im Browser.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Kontakt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Rechtliches und Fragen:{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg"
          >
            {CONTACT}
          </a>
          . Repository:{" "}
          <a
            href="https://github.com/Linopix/Jahrgang"
            className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg"
          >
            Linopix/Jahrgang
          </a>
          .
        </p>
      </section>
    </main>
  );
}
