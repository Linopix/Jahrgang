# Jahrgang

Musik-Zeitspiel: Hits hören, auf die Zeitlinie legen. Wer die Karten in der richtigen Reihenfolge hat, gewinnt den Abend.

Drei Modi:

- **Online-Abend** — Raumcode / Discord-Link, jede Person auf dem eigenen Gerät
- **Ein Bildschirm** — Hot-Seat, Gerät weitergeben
- **Solo** — drei Leben

## Discord-Abend (so spielt ihr)

1. Der Host öffnet die **Live-URL** (nicht localhost).
2. **Online-Abend** → Name eingeben → **Raum öffnen**.
3. **Discord-Link** kopieren und in den Call / Chat posten. Alternativ den vierstelligen Code vorlesen.
4. Freund:innen klicken den Link, geben ihren Namen ein, **Beitreten**.
5. Host wählt Repertoire und Ziel, dann **Abend starten**.
6. Nur wer am Zug ist, legt. Alle hören denselben Hit **auf ihrem Gerät**. Voice bleibt bei Discord — keinen Tab-Ton teilen.

Kosten: 0 €. Keine Accounts, kein Spotify, kein Discord-Bot.

## Online stellen (Vercel, ohne Grok)

Damit Freund:innen aus Discord reinkommen, braucht die App eine öffentliche Website plus eine kleine Datenbank nur für den Handshake. Beides ist kostenlos. Grok-Publish brauchst du nicht.

### 1. Vercel mit GitHub verbinden

1. Auf [vercel.com/signup](https://vercel.com/signup) mit **GitHub** anmelden (Hobby / Free).
2. **Add New… → Project**.
3. Das private Repo **Linopix/Jahrgang** importieren. Wenn es nicht erscheint: **Adjust GitHub App Permissions** und dem Vercel-Bot Zugriff auf dieses Repo geben.
4. Framework sollte **TanStack Start** sein. Build-Command: `npm run build`. Nicht ändern.
5. **Deploy**. Der erste Wurf kann schon die Startseite zeigen — Online-Abend funktioniert aber erst nach Schritt 2.

Danach bekommst du eine URL wie `https://jahrgang-….vercel.app`. Das ist noch nicht der Discord-Link.

### 2. Neon-Datenbank anschließen (Handshake)

Ohne Postgres landen Host und Gäste nicht im selben Raum.

1. In Vercel: [Marketplace → Neon](https://vercel.com/marketplace/neon) → **Install**.
2. **Create New Neon Account**, Plan **Free**, Region z. B. Frankfurt / EU.
3. Datenbank einen Namen geben (z. B. `jahrgang`).
4. **Connect Project** → dieses Vercel-Projekt → Umgebungen **Production** (und Preview, wenn du willst) → **Connect**.
5. Vercel setzt automatisch `DATABASE_URL`. Nichts abtippen, keine Keys in die App schreiben.
6. **Deployments → … am letzten Deployment → Redeploy**, damit die Tabellen angelegt werden.

Wenn der Redeploy grün ist: die **Production-URL** ist die Website für Discord.

### 3. Im Call spielen

Host öffnet die Vercel-URL → **Online-Abend** → **Discord-Link** in den Chat. Der Link enthält den Raumcode. Jeder Push auf `main` aktualisiert die Live-Seite von allein.

### Was du *nicht* einrichten musst

Kein Discord-Bot, kein Spotify, keine API-Keys, kein TURN-Server, keine Accounts in der App.

| Symptom | Was tun |
| --- | --- |
| Freund:innen kommen nicht in den Raum | Die **Vercel-URL** nutzen, nicht localhost. Nach Neon **Redeploy**? |
| Erster Deploy ok, Beitreten hängt | `DATABASE_URL` fehlt — Neon verbinden, dann Redeploy |
| Vercel findet das Repo nicht | GitHub-App: Zugriff auf das private Repo **Jahrgang** erlauben |
| Verbindung blockiert | VPN aus; Mobilfunk/strenges NAT kann einzeln scheitern |

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

Auf Windows immer `npm run dev` nutzen. Beenden mit **Strg+C**.

Zwei Fenster auf demselben PC: in einem Raum öffnen, im anderen denselben Code eingeben. Das testet nur lokal — Discord-Freund:innen brauchen die Vercel-URL.

## Spielregeln

1. Jede Person startet mit einer offenen Karte auf der eigenen Zeitlinie (links früh, rechts spät).
2. Ein neuer Hit spielt. Du siehst weder Titel noch Jahr.
3. Platz tippen, ablegen. Sitzt die Lage, bleibt die Karte.
4. Joker: Jahrzehnt oder Überspringen. Wer zuerst das Ziel (6/8/10) erreicht, gewinnt.

Vorschauen kommen von iTunes. Ohne Netz startet das Spiel nicht.

## Technik (kurz)

Züge laufen direkt zwischen den Browsern (WebRTC). Der Server kennt nur den Raumcode für den Handshake (Neon). Der Host ist Schiedsrichter. Open Relay TURN ist als kostenloser Fallback eingebaut.

## Stack

React 19, TanStack Start, Vite, Tailwind, Zustand. Hosting: Vercel Hobby. Handshake: Neon Free. Node 22.
