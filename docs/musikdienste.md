# Musikdienste

Jahrgang läuft ohne Konto und ohne Abo. Der Katalog kommt aus dem Spiel, die kurzen Vorschauen aus iTunes und Deezer — so, wie die Stores sie öffentlich anbieten. Alles andere ist Extra.

Diese Seite ist für dich, wenn du das Extra einschalten willst: eigene Likes, eigene Playlists, oder volle Titel statt der 30-Sekunden-Nadel.

---

## Kurz

| | Ohne Login | Mit Spotify (Free) | Mit Spotify (Premium) |
| --- | --- | --- | --- |
| Spielen | ja | ja | ja |
| Katalog-Packs | ja | ja | ja |
| Öffentliche Playlist als Stapel | ja (Spotify- oder Deezer-Link) | ja | ja |
| Eigene Likes als Pack | — | ja | ja |
| Volle Titel statt Vorschau | — | nein | ja, auf diesem Gerät |
| Online / Wohnzimmer | ja | ja | ja, Audio am Gerät das spielt |

Ohne Premium geht also der ganze Abend. Premium ändert nur, *wie lang* der Titel auf dem Gerät läuft, das gerade hörbar ist.

---

## Wie Spotify ins Spiel passt

Nicht als Tür, als zweites Fach.

1. **Der Abend startet wie immer.** Pack, Stil, Mix, öffentliche Playlist — nichts davon braucht Spotify.
2. **Unter Repertoire** steht ein kleiner Knopf *Spotify optional verbinden*. Kein Modal, kein Zwang, kein Hinweis der den Start blockiert.
3. **Nach dem Login** erscheint das Pack *Meine Titel*: Likes und die eigenen Playlists, gemischt, Doppelte einmal. Reicht der Stapel nicht, kann man es als zweites Pack dazu nehmen.
4. **Free** bleibt bei der öffentlichen Vorschau (iTunes/Deezer, 30 Sekunden). In der Zeile steht `Free, Vorschau`.
5. **Premium** schaltet auf diesem Gerät den Spotify-Player ein. Dann läuft der volle Titel. In der Zeile steht `volle Titel`.
6. **Trennen** nimmt Likes und Player wieder weg. Der Katalog bleibt.

So fühlt es sich an wie ein extra Plattenkoffer, nicht wie eine Anmeldung vor dem Spiel.

### Online, Handy, Wohnzimmer, Discord

Audio hängt immer am Gerät, das den Ton ausgibt — nicht am Raum.

**Klassisch online (jedes Handy spielt selbst).**
Jede Person hört lokal. Wer Premium verbunden hat, hört voll. Wer Free ist oder nicht verbunden, hört die Vorschau. Der Raum läuft trotzdem, weil die Vorschau der Standard ist.

**Wohnzimmer (Fernseher + Handys).**
Geraten wird auf den Handys, gehört wird am Fernseher. Deshalb reicht **ein** Premium-Konto am Fernseher bzw. am Gerät, das den Ton macht. Die Handys brauchen keins. Überspringt man den Host-Claim, bleibt der Fernseher Admin — dann muss Premium dort sitzen, nicht auf einem Handy.

**Discord-Übertragung.**
Der Streamer teilt Bild und Ton. Nur dieses Gerät spielt Musik. Ein Premium am Streamer reicht für volle Titel im Call. Die Zuschauer brauchen weder Spotify noch Premium.

**Remote ohne Premium.**
Ja. Free reicht zum Mitspielen, zum Beitreten, zum Wohnzimmer und zum Stream. Free reicht auch, um Likes als extra Pack in den Stapel zu legen. Free reicht nicht für den Spotify-Player (volle Titel). Dafür fällt das Spiel auf die öffentliche Vorschau zurück — das ist Absicht, nicht ein Fehler.

---

## Spotify einrichten

Der Code ist schon da (`src/lib/spotify/`, Routen unter `/api/spotify/`). Aus ist er, bis du das Flag kippst.

Seit März 2026 gilt bei Spotify: **wer die App im Dashboard anlegt, braucht selbst Premium** (Development Mode). Die Leute, die später im Spiel verbinden, nicht zwingend. Für mehr als ein paar Testnutzer beantragst du Extended Quota.

### 1. App im Dashboard

1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) — mit deinem Premium-Konto.
2. *Create app*. Name z. B. `Jahrgang`. Website die öffentliche URL.
3. Redirect URIs, exakt, ohne Slash am Ende mehr als den Pfad:

   ```
   http://localhost:8080/api/spotify/callback
   https://DEINE-DOMAIN/api/spotify/callback
   ```

   Live bei uns: `https://jahrgang.vercel.app/api/spotify/callback`
4. APIs: Web API. Für volle Titel zusätzlich Web Playback SDK.
5. Client ID und Client Secret notieren. Secret nur auf dem Server.

### 2. Umgebungsvariablen

Lokal in der Umgebung der Dev-Session, auf Vercel unter Project → Settings → Environment Variables:

| Variable | Pflicht | Beispiel |
| --- | --- | --- |
| `SPOTIFY_CLIENT_ID` | ja | aus dem Dashboard |
| `SPOTIFY_CLIENT_SECRET` | ja | aus dem Dashboard |
| `SPOTIFY_REDIRECT_URI` | nein | nur setzen, wenn die Callback-URL nicht `${Origin}/api/spotify/callback` ist |
| `SPOTIFY_MARKET` | nein | `DE` |

Kein Secret ins Repo. `.env` gehört nicht ins Git.

### 3. Einschalten

In [`src/lib/spotify/flags.ts`](../src/lib/spotify/flags.ts):

```ts
export const SPOTIFY_LIVE = true;
```

Dann deployen. Ohne ID/Secret bleibt der Login tot, das Spiel nicht.

Lokal: `npm run dev`, auf Start → Party oder Online → unter Repertoire verbinden. Nach dem Callback landest du wieder im Spiel, mit `?spotify=ok` in der URL.

### 4. Quota

Frisch angelegte Apps sind im Development Mode: wenige Testnutzer, du selbst brauchst Premium. Wenn Freundinnen ohne Eintrag im Dashboard verbinden sollen, [Extended Quota](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) beantragen. Das Formular ist nervig, aber ohne geht der Login für Fremde nicht durch.

### Scopes, die Jahrgang setzt

`user-library-read`, `playlist-read-private`, `playlist-read-collaborative`, `user-top-read` fürs Pack. `streaming`, `user-modify-playback-state`, `user-read-playback-state` für den Player. Plus `user-read-private` / `user-read-email`, damit wir Free gegen Premium unterscheiden können.

Weniger Scopes = weniger Player. Nicht kürzen, wenn du volle Titel willst.

---

## Deezer

Deezer steckt **schon** in der Vorschau und in öffentlichen Playlists. Dafür brauchst du kein Konto, kein Dashboard, kein Flag.

Ein optionales *Meine Deezer-Titel* (Likes wie bei Spotify) wäre ähnlich leicht wie Spotify:

1. App auf [developers.deezer.com](https://developers.deezer.com) — kostenlos, ohne Abo-Pflicht für dich.
2. Redirect `https://DEINE-DOMAIN/api/deezer/callback`
3. Application ID + Secret in die Umgebung
4. OAuth, dann `/user/me/tracks` und Playlists

Volle Titel über das Deezer SDK brauchen ein Deezer-Premium. Free bleibt bei der 30-Sekunden-Vorschau — dieselbe Linie wie Spotify. Der Aufwand ist überschaubar, der Gewinn klein, weil die Vorschau schon ohne Login sitzt. Deshalb ist der Login bei uns noch nicht gebaut.

---

## Apple Music

Geht. Ist aber nicht leicht, und nicht kostenlos.

Du brauchst:

- eine **Apple-Developer-Mitgliedschaft** (derzeit 99 USD im Jahr)
- eine Media ID plus **MusicKit-Key** (`.p8`)
- serverseitig ein **JWT (ES256)** als Developer Token, mit Team-ID, Key-ID und der Origin der Website
- MusicKit JS im Browser
- für volle Titel: die spielende Person muss **Apple Music abonniert** haben

Ohne Abo gibt es Katalogsuche und kurze Previews — das können iTunes und Deezer bei uns schon, ohne 99 Dollar.

### Wenn du es trotzdem anbinden willst

1. [developer.apple.com/account](https://developer.apple.com/account) → Certificates, Identifiers & Profiles.
2. *Identifiers* → Media ID für Jahrgang, MusicKit an.
3. Key mit MusicKit / Media Services, `.p8` einmalig herunterladen. Liegt nur auf dem Server.
4. JWT bauen: `iss` = Team-ID, `kid` = Key-ID, Algorithmus ES256, Ablauf ein paar Monate, Claim `origin` = genaue Site-Origin (`https://jahrgang.vercel.app`).
5. Token nie ins Frontend hardcoden. Ein Server-Endpunkt `/api/apple/token` gibt ein frisches JWT aus.
6. Im Client [MusicKit JS](https://js-cdn.music.apple.com/musickit/v3/musickit.js) laden, `MusicKit.configure({ developerToken, app: { name: "Jahrgang", build: "1" } })`, dann `authorize()` für die Mediathek.
7. Wie bei Spotify: nur als Extra-Pack und optionaler Player. Start ohne Apple-Konto muss bleiben.

Erwartete Umgebung:

| Variable | Bedeutung |
| --- | --- |
| `APPLE_TEAM_ID` | 10 Zeichen |
| `APPLE_KEY_ID` | 10 Zeichen |
| `APPLE_PRIVATE_KEY` | Inhalt der `.p8`, Zeilenumbrüche als `\n` |
| `APPLE_MUSIC_ORIGIN` | `https://jahrgang.vercel.app` |

Das ist ein eigener Spielzug, kein Schalter wie `SPOTIFY_LIVE`. Wenn du ihn willst, bauen wir ihn analog: Flag aus, Spiel ohne, Login unter Repertoire.

---

## Was wir nicht anbinden

**YouTube / YouTube Music.** Keine saubere Audio-API für ein Ratespiel. Einbettungen bringen Player, Werbung und Bedingungen mit, die nicht zu einer verdeckten Nadel passen.

**Amazon Music, Tidal, SoundCloud.** Entweder kein Web-Playback für Dritte, oder der Zugang zur API ist geschlossen. Der Gewinn für einen Abend am Tisch ist gering, der Aufwand nicht.

Öffentliche Playlists von Spotify und Deezer bleiben der einfache Weg, fremde Stapel reinzuholen — ohne dass irgendwer ein Entwicklerkonto braucht.

---

## Recht und Ton

Jahrgang speichert keine Musikdateien. Die Vorschau kommt live vom Store. Ein verbundenes Konto liefert nur Metadaten (Titel, Interpret, Jahr) und, bei Premium, den Stream auf dem Gerät der Person. Trennen löscht die Session-Cookies.

Wenn du streamst: Jahrgang nennen, nicht so tun als wäre es ein anderes Spiel. Details stehen unter [/hinweise](https://jahrgang.vercel.app/hinweise).

Fragen: [jahrgang.game@icloud.com](mailto:jahrgang.game@icloud.com)
