# Jahrgang

Musik-Zeitspiel: Hits hören, auf die Zeitlinie legen. Wer die Karten in der richtigen Reihenfolge hat, gewinnt den Abend.

Aktuell läuft **Partyabend** als Hot-Seat auf einem Gerät (bis 8 Spieler) und **Solo** mit drei Leben. Online-Multiplayer ist vorbereitet, aber noch nicht eingebaut — der Plan steht unten.

## Auf Windows starten

### 1. Programme

- [Git for Windows](https://git-scm.com/download/win)
- [Node.js 22 LTS](https://nodejs.org/) (Windows Installer, 64-bit)

Danach **PowerShell neu öffnen** und prüfen:

```powershell
git --version
node --version
npm --version
```

`node` sollte mit `v22` beginnen. Optional: [GitHub Desktop](https://desktop.github.com/) — einfacher für das private Repo.

### 2. Projekt holen

**GitHub Desktop:** dieses Repo öffnen → **Code** → **Open with GitHub Desktop** → Ordner wählen → Clone.

**PowerShell:**

```powershell
cd $HOME\Documents
git clone https://github.com/Linopix/Jahrgang.git
cd Jahrgang
```

Das Repo ist privat. GitHub Desktop loggt dich ein; in der Konsole fragt Git nach Login oder einem [Personal Access Token](https://github.com/settings/tokens).

### 3. Installieren und starten

```powershell
cd $HOME\Documents\Jahrgang
npm install
npm run dev
```

Im Browser öffnen: [http://localhost:8080](http://localhost:8080)

`startup.sh` ist nur für Linux. Auf Windows immer `npm run dev` nutzen. Beenden mit **Strg+C**.

Produktionsbuild lokal testen:

```powershell
npm run build
npm run preview
```

### Typische Probleme

| Symptom | Was tun |
| --- | --- |
| `git` / `node` nicht gefunden | PowerShell nach der Installation neu öffnen |
| Clone schlägt fehl | GitHub Desktop nutzen oder bei GitHub angemeldet sein |
| Port 8080 belegt | Anderen Prozess beenden, der den Port hält |
| `npm install` bricht ab | Node **22** verwenden, nicht 18/20 |
| Seite bleibt weiß | Dev-Server muss laufen bleiben; URL genau `http://localhost:8080` |

## Spielen

1. **Partyabend** oder **Alleine spielen** wählen.
2. Namen, Repertoire (z. B. 80er, Deutsch, Alles) und Ziellänge (6 / 8 / 10 Karten) festlegen.
3. Song hören, Lücke auf der eigenen Zeitlinie antippen, ablegen.
4. Richtig: die Karte bleibt. Falsch: sie geht an den nächsten.
5. Joker: **Jahrzehnt** (einmaliger Hinweis) und **Skip** (Karte zurück ins Deck). Je 2 Tokens.
6. Solo: 3 Leben. Party: wer zuerst die Ziellänge erreicht, gewinnt.

Vorschauen kommen von iTunes. Ohne Netz startet das Spiel nicht.

## Online-Multiplayer — so würde es gehen

Heute sitzen alle am **selben Bildschirm**. Online soll jede Person auf dem **eigenen Handy oder Laptop** mitspielen, mit einem kurzen Raumcode.

Das passt gut: das Spiel ist rundenbasiert, 2–8 Freund:innen, kein Ranglisten-Modus. Im Repo liegt bereits ein WebRTC-Baukasten unter `src/lib/multiplayer/`.

### Ablauf für Spieler:innen

1. Host tippt **Online-Abend** → bekommt z. B. Code `K7M2`.
2. Gäste öffnen dieselbe Website, geben Code + Namen ein.
3. Lobby zeigt, wer verbunden ist. Host wählt Repertoire und startet.
4. Jeder hört den Song **lokal**. Nur die Person am Zug legt auf **ihrer** Zeitlinie ab.
5. Alle sehen sofort, ob es saß, und wessen Zug als Nächstes kommt.

### Technik (kurz)

```
Handy A ↔→ Handy B ↔→ Handy C     Spielzüge direkt (WebRTC)
        \       |       /
         \      |      /
          Server /api/rtc     nur Handshake (wer ist im Raum?)
```

- **Raumcode** ist der WebRTC-Room. Nicht alle Besucher in einem globalen Raum — sonst landen Fremde in derselben Partie.
- **Host ist Schiedsrichter.** Der Host lädt die Songliste (iTunes-Vorschau-URLs), prüft Ablagen mit derselben Logik wie jetzt (`canPlace` in `src/lib/game/engine.ts`) und schickt den neuen Stand an alle. So legen nicht zwei Leute gleichzeitig.
- **Zuverlässige Nachrichten** für Züge: `start`, `place`, `decade`, `skip`, `next`, `leave`. Kein Dauer-Streaming — das Spiel ist langsam genug.
- **Audio bleibt lokal.** Jeder Client spielt `previewUrl` selbst. Der Server muss keine Musik streamen.
- **Vertrauensmodell:** unter Freund:innen okay. Ein Host könnte theoretisch mogeln. Für ein Wohnzimmer-Spiel ist das in Ordnung; für öffentliche Ligen bräuchte man einen echten Spielserver.

Was noch gebaut werden müsste:

| Teil | Zweck |
| --- | --- |
| `src/lib/multiplayer/signaling.server.ts` + `src/routes/api/rtc.ts` | Handshake-Relay (liegt als Vorlage im Projekt, ist aber noch nicht verdrahtet) |
| Lobby-UI (Code erzeugen / beitreten) | Dritter Startknopf neben Party und Solo |
| Host-State in `store.ts` | Eine Quelle der Wahrheit, Broadcast nach jedem Zug |
| Disconnect | Host pausiert oder der Zug geht weiter, wenn jemand die Seite schließt |

### Was lokal auf Windows geht — und was nicht

| Situation | Realistisch? |
| --- | --- |
| Zwei Browser-Fenster auf **demselben PC** | Ja, zum Entwickeln |
| Handys im **selben WLAN**, Dev-Server auf dem PC | Nur wenn Firewall Port 8080 durchlässt und alle `http://DEINE-IP:8080` öffnen |
| Freund:innen **über Internet** | Nein, solange die App nur auf `localhost` läuft. Dafür die App **deployen** (z. B. Vercel). Der Handshake braucht eine öffentliche URL. |

Manche Netze blockieren direkte P2P-Verbindungen (strenges NAT, ~10–20 %). Dann würde ein TURN-Server fehlen; STUN allein (Google/Cloudflare, schon im Client) reicht oft, aber nicht immer.

### Warum nicht Socket.io / ein großer Server?

Ginge auch, wäre aber mehr Betrieb: jeder Zug läuft über den Server, Kosten und Latenz steigen, und für ein Party-Spiel bringt das wenig. P2P ist hier die leichtere Variante. Ein zentraler Server lohnt erst, wenn es Matchmaking, Anti-Cheat oder Zuschauer geben soll.

## Stack

React 19, TanStack Start, Vite, Tailwind, Zustand. Node 22.
