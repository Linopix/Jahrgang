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
        Jahrgang ist ein Zeitspiel. Es ist kein Streamingdienst.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Musik</h2>
        <p className="text-sm leading-relaxed text-muted">
          Die App speichert, verteilt und spielt keine Musikdateien, keine
          30-Sekunden-Vorschauen und keine Albumcover. Der Katalog enthält nur
          öffentlich bekannte Angaben: Interpret, Titel, Jahr.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Zum Hören öffnest du den Titel in deinem eigenen Abo — Spotify, Apple
          Music, YouTube oder Deezer. Die Rechte liegen bei dem Dienst, mit dem
          du dich anmeldest. Online sieht nur der Host den Namen, damit die
          anderen raten können.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Wer streamt: Plattformen können Musik in Aufzeichnungen stummschalten.
          Das liegt an deren Regeln, nicht an Jahrgang.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Listen</h2>
        <p className="text-sm leading-relaxed text-muted">
          Eigene Repertoires sind Textlisten (Interpret – Titel). Öffentliche
          Deezer-Links liefern nur die Titelnamen, keine Dateien. Fehlende Jahre
          werden über die öffentliche iTunes-Suche als Metadaten ergänzt, ohne
          Vorschau und ohne Cover.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Daten</h2>
        <p className="text-sm leading-relaxed text-muted">
          Keine Konten. Namen bleiben auf dem Gerät. Online-Räume dienen nur der
          Verbindung; Spielzüge gehen direkt zwischen den Geräten. Schriftarten
          kommen von dieser Website, nicht von Google.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Kontakt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Privates Projekt. Fragen und Hinweise über das Repository{" "}
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
