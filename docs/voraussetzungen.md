# Was du können solltest

Eine Liste der Kenntnisse, die für Beiträge an diesem Repository nötig oder nützlich sind.

Jahrgang ist ein Browser-Spiel in TypeScript. Der Spielstand liegt im Client. Online verbindet die Browser über WebRTC. Der Server vermittelt nur den Raumcode.

---

## Muss

| | Warum |
| --- | --- |
| **TypeScript lesen** | Der Code ist TypeScript. Ausreichend: Funktionen, `type`/`interface`, `import`. |
| **Git** | `clone`, Branch, Commit, Pull Request. |
| **Deutsch schreiben** | Spielertexte sind Deutsch. Kurze Sätze, Du-Form, keine Floskeln. |
| **HTML/CSS im Browser** | Das Spiel ist eine Website. Konsole und Netzwerk-Tab sollten bedienbar sein. |

Damit kannst du Katalogzeilen, Pack-Filter und sichtbare Texte ändern.

---

## Hilft

| | Warum |
| --- | --- |
| **React, Funktionskomponenten** | Bildschirme sind React (`useState`, `useEffect`, Props). |
| **Zustand** | `useGame` und `useOnline` sind Stores: ein Objekt im Speicher, die UI liest Felder. |
| **HTTP und JSON** | Vorschauen, Playlists, Signaling. |
| **Node 22** | `npm install`, `npm run dev`. |

React kann parallel gelernt werden. Online-Protokoll nicht als erste Aufgabe.

---

## Je nach Aufgabe

| Aufgabe | Zusätzlich |
| --- | --- |
| Katalog, Packs, Texte | Muss-Liste. [entwicklung.md](entwicklung.md) bis „Katalog und Packs“. Mix und Playlist liegen außerhalb von `PACK_GROUPS`. |
| Spielregel (legen, Stapel, Ziel) | `canPlace` in `engine.ts` und Tests. Kein React. |
| Bildschirm, Slider, Menü | React und vorhandene Tailwind-Klassen (`bg-raised`, `text-muted`). Keine neuen Farben. |
| Online-Zug, Chat, Host-Wechsel | Host rechnet, Gäste senden Nachrichten. Vertrag: `protocol.ts`. |
| Bigscreen | `hostId` ist die Bühne, `adminId` das steuernde Gerät. |
| Spotify | OAuth (Redirect, Code, Token). Anleitung: [musikdienste.md](musikdienste.md). `SPOTIFY_LIVE` ist oft `false`. |
| Einladungsbild | `og:`-Tags, `src/lib/og/`. |

---

## Nicht nötig

- SQL für den Spielablauf (die Datenbank dient der WebRTC-Vermittlung)
- Docker
- Native Apps oder Game-Engines
- GraphQL
- ICE-Details (STUN ist gesetzt)

Auth, Konto und Rangliste sind im Code, aber ausgeschaltet (`ACCOUNT_LIVE`). Daran nur arbeiten, wenn das Feature wieder eingeschaltet wird.

---

## Werkzeug

- Node 22 (`.nvmrc`)
- npm (`package-lock.json`)
- Editor mit TypeScript
- Chrome oder Firefox
- Für Online: zwei Fenster oder Handy und Rechner im selben Netz

---

## Erster Tag

1. [entwicklung.md](entwicklung.md) bis zur Phasen-Tabelle.
2. `npm install` und `npm run dev`. Eine Solo-Runde, danach Online mit zwei Fenstern.
3. In `catalog.ts` einen bekannten Titel suchen und das Jahr prüfen.
4. `npx tsc --noEmit` und `npm test`.
5. Eine kleine Änderung: Text, ein Song oder ein Pack-Label.

---

## Vor dem Senden

- Spielertext Deutsch, kurz, ohne Emoji (außer der Reaktionsleiste).
- Regeländerung: Test in der Datei daneben.
- Online: kein `useGame.setState` auf dem Gast.
- `npx tsc --noEmit` ohne Fehler.
- Die Änderung im Browser geprüft.
