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
        Jahrgang ist ein Zeitspiel für den privaten Abend. Es erzielt keinen
        Gewinn. Kein offizielles Produkt, keine Verbindung zu anderen Spielen
        oder Labels.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Name</h2>
        <p className="text-sm leading-relaxed text-muted">
          Jahrgang steht für sich. Es ist weder lizenziert noch unterstützt von
          Herstellern ähnlicher Gesellschaftsspiele. Wer die Runde öffentlich
          zeigt, soll sie als Jahrgang benennen — nicht unter einem anderen
          Markennamen.
        </p>
      </section>

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
        <h2 className="font-display text-2xl font-medium text-fg">Projekt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Jahrgang ist privat und unentgeltlich. Keine Werbung, kein Shop, keine
          Beiträge. Es wird kein Gewinn erzielt.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Konto</h2>
        <p className="text-sm leading-relaxed text-muted">
          Optional. Nur ein Name und ein Geheimwort, damit die Rangliste über
          Geräte zählt. Kein E-Mail, kein Gewinn. Wer das Wort vergisst, legt
          ein neues Konto an.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Discord</h2>
        <p className="text-sm leading-relaxed text-muted">
          Stimme bleibt in Discord, das Spiel im Browser. Ein Status im
          Discord-Profil aus dem normalen Tab geht nicht — Discord erlaubt das
          nur in einer Activity.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Kontakt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Rechtliche Hinweise, Abmahnungen und Fragen an{" "}
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
