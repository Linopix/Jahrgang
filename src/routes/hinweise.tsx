import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hinweise")({
  component: HinweisePage,
});

function HinweisePage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Hinweise</h1>
      <p className="mt-3 text-sm text-muted">
        Jahrgang ist ein Zeitspiel für den privaten Abend.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Musik</h2>
        <p className="text-sm leading-relaxed text-muted">
          Zum Raten läuft eine kurze Vorschau, die die Stores öffentlich
          anbieten. Jahrgang ist kein Streamingdienst und speichert die Dateien
          nicht. Öffentliche Playlists von Spotify oder Deezer dienen nur dazu,
          Titel für die Runde zu finden.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Daten</h2>
        <p className="text-sm leading-relaxed text-muted">
          Keine Konten. Namen bleiben auf dem Gerät. Online-Räume dienen nur der
          Verbindung; Spielzüge gehen direkt zwischen den Geräten.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Kontakt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Privates Projekt. Fragen über das Repository{" "}
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
