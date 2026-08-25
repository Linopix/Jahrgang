# Jahrgang

Musik-Zeitspiel: Hits hören, auf die Zeitlinie legen. Wer die Karten in der richtigen Reihenfolge hat, gewinnt den Abend.

Drei Modi:

- **Online-Abend** — Raumcode / Discord-Link, jede Person auf dem eigenen Gerät
- **Ein Bildschirm** — Hot-Seat, Gerät weitergeben
- **Solo** — drei Leben

## Discord-Abend (so spielt ihr)

1. Der Host öffnet die **veröffentlichte** Website (nicht localhost).
2. **Online-Abend** → Name eingeben → **Raum öffnen**.
3. **Discord-Link** kopieren und in den Call / Chat posten. Alternativ den vierstelligen Code vorlesen.
4. Freund:innen klicken den Link, geben ihren Namen ein, **Beitreten**.
5. Host wählt Repertoire und Ziel, dann **Abend starten**.
6. Nur wer am Zug ist, legt. Alle hören denselben Hit. Voice bleibt bei Discord.

Kosten: 0 €. Keine Accounts, kein Spotify.

### Was du einrichten musst

Für Freund:innen **über Internet / Discord** muss die App **online veröffentlicht** sein (Grok-App publishen oder nach Vercel deployen). `localhost` auf Windows reicht nur zum eigenen Testen mit zwei Browser-Fenstern.

Sonst nichts: keine API-Keys, keine Datenbank von Hand, keine TURN-Konfiguration. Die App legt den Handshake selbst an.

Falls jemand nicht reinkommt: VPN aus, denselben Link nochmal öffnen, Code laut vorlesen (ohne 0/O/1/I).

## Auf Windows starten (Entwicklung)

### 1. Programme

- [Git for Windows](https://git-scm.com/download/win)
- [Node.js 22 LTS](https://nodejs.org/) (Windows Installer, 64-bit)

Danach **PowerShell neu öffnen** und prüfen:

```powershell
git --version
node --version
npm --version
```

`node` sollte mit `v22` beginnen. Optional: [GitHub Desktop](https://desktop.github.com/).

### 2. Projekt holen

```powershell
cd $HOME\Documents
git clone https://github.com/Linopix/Jahrgang.git
cd Jahrgang
```

### 3. Installieren und starten

```powershell
npm install
npm run dev
```

Im Browser: [http://localhost:8080](http://localhost:8080)

Auf Windows immer `npm run dev` nutzen, nicht `startup.sh`. Beenden mit **Strg+C**.

Zwei Fenster auf demselben PC: in einem Raum öffnen, im anderen denselben Code eingeben.

### Typische Probleme

| Symptom | Was tun |
| --- | --- |
| `git` / `node` nicht gefunden | PowerShell nach der Installation neu öffnen |
| Clone schlägt fehl | GitHub Desktop nutzen oder bei GitHub angemeldet sein |
| Port 8080 belegt | Anderen Prozess beenden |
| Freund:innen kommen nicht in den Raum | Die **veröffentlichte** URL nutzen, nicht localhost |
| Verbindung blockiert | VPN aus; Mobilfunk/strenges NAT kann einzeln scheitern |

## Spielregeln

1. Jede Person startet mit einer offenen Karte auf der eigenen Zeitlinie (links früh, rechts spät).
2. Ein neuer Hit spielt ohne Titel. Einordnen, nicht das genaue Jahr raten.
3. Platz tippen, ablegen. Sitzt die Lage, bleibt die Karte.
4. Joker: Jahrzehnt oder Überspringen. Wer zuerst das Ziel (6/8/10) erreicht, gewinnt.

Vorschauen kommen von iTunes. Ohne Netz startet das Spiel nicht.

## Technik (kurz)

Züge laufen direkt zwischen den Browsern (WebRTC). Der Server kennt nur den Raumcode für den Handshake. Der Host ist Schiedsrichter. Open Relay TURN ist als kostenloser Fallback eingebaut, falls ein Netz direkte Verbindung blockiert.

## Stack

React 19, TanStack Start, Vite, Tailwind, Zustand. Node 22.
