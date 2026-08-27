# Was du können solltest

Kein Bewerbungstext. Eine ehrliche Liste, damit du weißt, ob du heute eine Zeile Katalog ändern kannst oder erst React anschauen solltest.

Jahrgang ist ein **Browser-Spiel** in TypeScript. Es gibt kein extra Backend für den Spielstand. Wer Online anfasst, muss WebRTC nicht selbst erfunden haben — aber wissen, dass zwei Browser miteinander reden.

---

## Muss (sonst wird’s zäh)

| | Warum |
| --- | --- |
| **Lesen von TypeScript** | Der ganze Code ist TS. Du musst nicht jedes Generic erklären können. Du musst eine Funktion, einen `type` und ein `import` lesen können. |
| **Git** | `clone`, Branch, Commit, Pull Request. Nicht `rebase -i`. |
| **Deutsch schreiben** | Alles, was Spieler sehen, ist Deutsch. Kurze Sätze, Du, keine Floskeln. |
| **Der Browser als Ort** | HTML, ein bisschen CSS, die Konsole aufmachen. Das Spiel *ist* eine Website. |

Wenn das sitzt, kannst du Songs in den Katalog legen, Texte ändern, einen Pack-Filter anpassen und Tests laufen lassen. Das ist der häufigste, nützlichste Beitrag.

---

## Hilft sehr

| | Warum |
| --- | --- |
| **React, Funktionskomponenten** | Bildschirme sind React. `useState`, `useEffect`, Props. Kein Redux, kein Class-Component. |
| **„Ein Store hält den Stand“** | Wir nutzen [Zustand](https://github.com/pmndrs/zustand). Denk: ein Objekt im Speicher, die UI liest davon. `useGame`, `useOnline`. |
| **HTTP, JSON** | Vorschauen, Playlists, Signaling. `fetch`, Statuscodes. |
| **Node 22 auf der Kommandozeile** | `npm install`, `npm run dev`. Kein Docker. |

React lernst du parallel. Fang nicht mit Online an.

---

## Je nach Aufgabe

| Du willst … | Dann zusätzlich |
| --- | --- |
| Nur Katalog / Packs / Texte | Muss-Liste reicht. Lies [entwicklung.md](entwicklung.md) bis „Katalog und Packs“. |
| Spielregel (legen, Stapel, Ziel) | `canPlace` in `engine.ts` + Tests. Reine Funktionen, kein React. |
| Bildschirm / Slider / Menü | React + Tailwind-Klassen, die schon da sind (`bg-raised`, `text-muted`). Keine neue Farbwelt. |
| Online-Zug, Chat, Host weg | Das Bild „Host rechnet, Gäste schicken Nachrichten“. `protocol.ts` ist die Speisekarte. WebRTC-Details stehen in `p2p.ts` — erst anfassen, wenn Lobby und Snapshot sitzen. |
| Wohnzimmer / Discord | `hostId` (Bühne) vs. `adminId` (Handy). Nicht dasselbe. |
| Spotify | OAuth in groben Zügen (Redirect, Code, Token). Anleitung: [musikdienste.md](musikdienste.md). Flag ist oft **aus**. |
| Einladungsbild / Link-Vorschau | SVG/PNG, Discord/WhatsApp lesen `og:`-Tags. `src/lib/og/`. |

---

## Brauchst du nicht

Damit niemand drei Wochen „Backend“ lernt:

- Kein SQL fürs Spiel (die kleine Datenbank ist nur die WebRTC-Vermittlung)
- Kein Docker, Kubernetes, Redis
- Kein Unity, keine App-Stores
- Kein GraphQL
- Kein Experte für WebRTC-ICE — STUN ist vorkonfiguriert
- Kein Design-Studium; das Theme steht in `styles.css`

Auth, Konto, Rangliste sind **im Code, aber ausgeschaltet**. Daran arbeiten nur, wenn jemand das Feature bewusst wieder anmacht.

---

## Werkzeug

- **Node 22** (siehe `.nvmrc`)
- **npm** (lockfile ist `package-lock.json`, nicht yarn/pnpm)
- Editor mit TypeScript (VS Code reicht)
- Chrome oder Firefox, dazu die Konsole
- Für Online lokal: zwei Fenster, oder Handy und Rechner im selben Netz

---

## Der erste Tag

1. [entwicklung.md](entwicklung.md) einmal von oben bis zur Phasen-Tabelle.
2. `npm install` und `npm run dev`. Solo-Runde spielen, dann Online mit zwei Fenstern.
3. In `catalog.ts` einen Titel finden, den du kennst. Jahr prüfen.
4. `npx tsc --noEmit` und die Tests unter `src/lib/game/*.test.ts` laufen lassen.
5. Erst danach: kleine, sichtbare Änderung (Text, ein Song, ein Pack-Label).

Wenn du nach dem ersten Tag nicht weißt, wo der Stapel liegt, ist die Doku schuld — sag Bescheid, statt drei Schichten Abstraction draufzulegen.

---

## Bevor du etwas schickst

- Spielertext Deutsch, kurz, ohne Emoji (außer die Reaktionsleiste).
- Regeländerung: Test in der Datei daneben (`engine.test.ts` …).
- Online: Host rechnet, Gast sendet. Kein `useGame.setState` auf dem Gast.
- `npx tsc --noEmit` ist grün.
- Du hast es selbst geklickt, nicht nur typisiert.
