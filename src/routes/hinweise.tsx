import { createFileRoute } from "@tanstack/react-router";
import { POOL_MAX } from "@/lib/game/types";

const CONTACT = "jahrgang.game@icloud.com";

export const Route = createFileRoute("/hinweise")({
  component: HinweisePage,
});

function HinweisePage() {
  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="back-link">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Hinweise</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Jahrgang ist zum Spielen bei euch, am Tisch oder im Call. Es kostet nichts und verdient
        nichts. Es gehört zu keinem anderen Brettspiel und zu keinem Label.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Name</h2>
        <p className="text-sm leading-relaxed text-muted">
          Wenn ihr streamt oder Freunde einladet, nennt es bitte Jahrgang. Nicht so tun, als wäre
          es ein anderes Spiel — auch wenn es sich ähnlich anfühlt.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Musik</h2>
        <p className="text-sm leading-relaxed text-muted">
          Du hörst eine kurze Vorschau, so wie sie der Store öffentlich anbietet. Mehr läuft nicht,
          und die Datei bleibt nicht hier. Eine Spotify- oder Deezer-Playlist ist nur die Titelliste
          für die Runde.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Daten</h2>
        <p className="text-sm leading-relaxed text-muted">
          Dein Name liegt auf dem Gerät. Der Server kennt den Raumcode, die Züge gehen direkt
          zwischen euch. Ein Konto für die Rangliste steckt schon im Code, ist aber gerade aus.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Projekt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Privat gebaut, ohne Werbung und ohne Shop. Wenn sich das ändert, steht es hier.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Discord</h2>
        <p className="text-sm leading-relaxed text-muted">
          Sprecht ruhig weiter in Discord, das Spiel läuft im Browser. Einen Status im Profil setzt
          Jahrgang von hier aus nicht.
        </p>
      </section>

      <section className="mt-10 scroll-mt-8 space-y-3" id="stapel">
        <h2 className="font-display text-2xl font-medium text-fg">Stapel</h2>
        <p className="text-sm leading-relaxed text-muted">
          In Solo, am einen Bildschirm und im normalen Online-Abend liegen höchstens {POOL_MAX}{" "}
          Titel auf dem Stapel. Das gilt auch, wenn das Pack mehr Titel hat. Im Turnier kommt das
          ganze Pack in den Stapel.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Die Zahl im Setup ist die Größe des Packs. Wie viele Titel wirklich gespielt werden, steht
          erst nach dem Start fest: nur Titel mit Hörprobe kommen auf den Stapel.
        </p>
      </section>

      <section className="mt-10 scroll-mt-8 space-y-3" id="hoerproben">
        <h2 className="font-display text-2xl font-medium text-fg">Fehlende Hörproben</h2>
        <p className="text-sm leading-relaxed text-muted">
          Jahrgang kann nur Titel abspielen, für die eine Kurzvorschau erreichbar ist. Das sind in
          der Regel 30 Sekunden. Die Datei wird nicht gespeichert. Sie kommt vom Store und läuft nur
          während des Zuges.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Beim Start fragt Jahrgang iTunes (Store Deutschland und USA) und Deezer. Bei einer
          öffentlichen Spotify- oder Deezer-Playlist wird zusätzlich die in der Einbettung
          hinterlegte Kurzvorschau gelesen (Feld audioPreview). Die Spotify Web API liefert für
          viele Titel kein preview_url. Fehlt diese URL und gibt es keinen Treffer bei iTunes oder
          Deezer, bleibt der Titel ohne Hörprobe.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Typische Ursachen: der Rechteinhaber stellt keine Kurzvorschau bereit. Der Titel ist im
          deutschen oder US-Store-Katalog nicht vorhanden. Es handelt sich um Spoken-Word-,
          Podcast- oder Regionalversionen ohne passenden Store-Eintrag. Titel und Interpret weichen
          so stark vom Store-Namen ab, dass kein Treffer zustande kommt.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Ohne Hörprobe kommt der Titel nicht in den Stapel. Die übrigen Titel der Liste bleiben
          spielbar. Jahrgang kann das für einzelne Titel nicht umgehen.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-2xl font-medium text-fg">Kontakt</h2>
        <p className="text-sm leading-relaxed text-muted">
          Fragen, auch rechtliche, an{" "}
          <a
            href={`mailto:${CONTACT}`}
            className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg"
          >
            {CONTACT}
          </a>
          . Der Code liegt auf{" "}
          <a
            href="https://github.com/Linopix/Jahrgang"
            className="text-fg underline decoration-border underline-offset-4 hover:decoration-fg"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}
