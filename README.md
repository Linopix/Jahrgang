# Jahrgang

**[Spielen](https://jahrgang.vercel.app)**

Ein Titel läuft. Name und Jahr bleiben verdeckt. Du ordnest ihn auf deiner Zeitlinie ein: links früher, rechts später. Wer zuerst alle Karten richtig liegen hat, gewinnt.

Zwei Varianten: **Zeitstrahl** nur nach Jahr, **Original** mit Interpret und Titel. Keine Anmeldung. Läuft im Browser auf Handy und Rechner.

![Jahrgang](public/og.jpg)

## So wird gespielt

Jede Person beginnt mit einer offenen Karte. Dann kommt ein neuer Titel. Du hörst ihn und wählst den Platz auf deiner Zeitlinie. Sitzt die Lage, bleibt die Karte. Liegt sie falsch, geht sie zurück.

**Zeitstrahl** ist das klassische Einordnen nach Erscheinungsjahr.

**Original** verlangt zusätzlich einen Tipp zu Interpret und Titel. Das Cover bleibt bis zum Aufdecken verdeckt. Richtige Tipps zählen als Treffer, die Karte selbst hängt weiter am Jahr.

Joker nach Einstellung: keine, eine oder zwei. Damit lässt sich das Jahrzehnt anzeigen oder der Titel überspringen.

Ziel sind 6, 8 oder 10 Karten. Repertoire wählbar, zum Beispiel 80er, 90er oder Deutsch. Optional eine öffentliche Spotify- oder Deezer-Playlist; bekannte Titel behalten ihr Hitjahr, der Rest kommt aus dem Repertoire.

## Mit anderen spielen

1. Eine Person öffnet [jahrgang.vercel.app](https://jahrgang.vercel.app) und wählt **Online-Abend**.
2. Namen eingeben, **Raum öffnen**.
3. Den Code oder den Link an die Runde schicken.
4. Die anderen treten bei.
5. Der Host wählt Spiel, Ziel, Joker, Repertoire und optional eine Playlist und startet.

Nur wer am Zug ist, legt. Alle hören denselben Titel auf ihrem Gerät. Bis zu acht Personen.

## Ein Bildschirm oder Solo

**Ein Bildschirm:** ein Gerät, reihum. Gut für denselben Tisch.

**Solo:** eine Zeitlinie, drei Fehlversuche.

## Hinweise

Die Vorschauen kommen von iTunes, Deezer oder der Playlist. Ohne Internet startet keine Runde. Die Playlist muss öffentlich sein. Spotify spielt nicht live, es werden nur die 30-Sekunden-Vorschauen gelesen.

Wenn jemand den Raum nicht findet: dieselbe Website öffnen, nicht eine lokale Datei. Code ohne Null und Eins vorlesen (die Zeichen gibt es im Code nicht).

Kleine Tippfehler beim Raten sind in Ordnung. „Beatles“ zählt für The Beatles, „YMCA“ für Y.M.C.A.

## Entwicklung

```bash
git clone https://github.com/Linopix/Jahrgang.git
cd Jahrgang
npm install
npm run dev
```

Node 22. Die App läuft unter `http://localhost:8080`.
