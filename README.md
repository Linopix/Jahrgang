# Jahrgang

Musik-Zeitspiel. Titel hören, nach Erscheinungsjahr auf der Zeitlinie einordnen. Wer die Karten in der richtigen Reihenfolge hat, gewinnt.

## Modi

| Modus | Ablauf |
| --- | --- |
| **Online-Abend** | Gemeinsames Spiel über Raumcode. Jede Person auf dem eigenen Gerät. |
| **Ein Bildschirm** | Hot-Seat am selben Gerät, bis zu acht Personen. |
| **Solo** | Eine Zeitlinie, drei Fehlversuche. |

## Spielablauf

1. Jede Person startet mit einer offenen Karte. Links ist früher, rechts später.
2. Ein neuer Titel spielt ohne Angabe von Name oder Jahr.
3. Platz auf der eigenen Zeitlinie wählen und ablegen.
4. Richtige Lage: die Karte bleibt. Falsche Lage: sie wird zurückgelegt.
5. Joker: Jahrzehnt anzeigen oder überspringen. Ziel sind 6, 8 oder 10 Karten.

Audio-Vorschauen kommen von iTunes. Ohne Netzverbindung startet keine Runde.

## Online-Spiel

1. Host öffnet die veröffentlichte Website und wählt **Online-Abend**.
2. Namen eingeben und **Raum öffnen**.
3. Vierstelligen Code oder Einladungslink an die Mitspieler geben.
4. Mitspieler treten bei (Name, **Beitreten**).
5. Host legt Repertoire und Ziel fest und startet.

Nur wer am Zug ist, legt. Alle anderen hören denselben Titel auf ihrem Gerät. Maximal acht Personen, keine Konten.

Zwei Browserfenster auf demselben Rechner eignen sich zum Testen. Für Mitspieler im Netz ist die öffentliche URL nötig.

## Veröffentlichung

Jahrgang wird über [Vercel](https://vercel.com) bereitgestellt. Für Online-Räume wird [Neon](https://neon.tech) als Postgres genutzt (nur Verbindungsaufnahme, keine Spielerkonten). Beides im kostenlosen Tarif.

### 1. Projekt auf Vercel

1. Unter [vercel.com/signup](https://vercel.com/signup) mit GitHub anmelden (Hobby).
2. **Add New → Project**, Repo `Linopix/Jahrgang` importieren.
3. Falls das private Repo fehlt: GitHub-App-Rechte anpassen und Zugriff auf *Jahrgang* erlauben.
4. Framework: **TanStack Start**. Build-Command: `npm run build`.
5. **Deploy**.

Die erzeugte Adresse hat die Form `https://….vercel.app`. Solo und Ein-Bildschirm funktionieren damit. Online-Abend benötigt den nächsten Schritt.

### 2. Datenbank verbinden

1. In Vercel: [Marketplace → Neon](https://vercel.com/marketplace/neon) → **Install**.
2. Neues Neon-Konto, Tarif **Free**.
3. Datenbank mit dem Vercel-Projekt verbinden, Umgebung **Production**.
4. `DATABASE_URL` wird gesetzt. Keine weiteren Schlüssel nötig.
5. Letztes Deployment **Redeploy**, damit die Tabellen angelegt werden.

Die Production-URL ist die öffentliche Spieladresse. Pushes auf `main` lösen ein neues Deployment aus.

### Störungen

| Symptom | Ursache |
| --- | --- |
| Mitspieler finden den Raum nicht | Localhost statt Production-URL, oder Neon noch nicht verbunden |
| Beitreten bleibt hängen | `DATABASE_URL` fehlt; Neon verbinden und Redeploy |
| Vercel zeigt das Repo nicht | GitHub-App hat keinen Zugriff auf das private Repo |
| Einzelne Verbindung scheitert | VPN oder restriktives NAT; anderes Netz versuchen |

## Entwicklung unter Windows

Voraussetzungen: [Git for Windows](https://git-scm.com/download/win), [Node.js 22 LTS](https://nodejs.org/). PowerShell danach neu öffnen.

```powershell
git --version
node --version
npm --version
```

`node` muss mit `v22` beginnen.

```powershell
cd $HOME\Documents
git clone https://github.com/Linopix/Jahrgang.git
cd Jahrgang
npm install
npm run dev
```

Die Entwicklungslaufzeit liegt unter [http://localhost:8080](http://localhost:8080). Beenden mit Strg+C.

## Technik

Züge laufen per WebRTC direkt zwischen den Browsern. Der Server vermittelt nur den Raumcode. Der Host prüft die Ablagen. Open Relay TURN dient als Fallback, wenn eine direkte Verbindung nicht zustande kommt.

Stack: React 19, TanStack Start, Vite, Tailwind, Zustand. Node 22.
