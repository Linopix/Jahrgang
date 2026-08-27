# Turnier-Oberfläche

Diese Datei beschreibt nur die Darstellung: Tafel, K.o.-Baum, QR-Codes, Bigscreen-Ansicht und das Feature-Flag in der UI. Ablauf, Gruppenlogik und P2P stehen in [turnier.md](turnier.md).

---

## Feature-Flag

In [`src/lib/tournament/flags.ts`](../src/lib/tournament/flags.ts):

```ts
export const TOURNAMENT_LIVE = true;
export { TOURNAMENT_LIVE as TOURNAMENT_MODE_ENABLED };
```

`false` blendet aus:

- Schalter „Turnier“ in [`game-options.tsx`](../src/components/game/game-options.tsx)
- Tafel in Lobby, Zuschaueransicht, Siegerbildschirm
- Bigscreen-Tafel
- Netz-Nachricht `{ t: "cup" }`

Die Komponenten bleiben im Bundle, rendern aber nichts (`TournamentBoard` und `TournamentWatch` kehren bei `false` sofort `null` zurück). Es gibt keine extra Tabs oder TV-Buttons nur für das Turnier.

---

## Dateien

| Datei | Aufgabe |
| --- | --- |
| [`tournament-board.tsx`](../src/components/game/tournament-board.tsx) | Tafel: Live-Zeile, Gruppenraster, K.o.-Spalten |
| [`qr-code.tsx`](../src/components/game/qr-code.tsx) | SVG-QR, weißer Rahmen, feste Modulgröße |
| [`qr.ts`](../src/lib/qr.ts) | Matrix und Pfad. `qrPath(matrix, pad)` verschiebt um die Quiet Zone |
| [`tv-lobby.tsx`](../src/components/game/tv-lobby.tsx) | Host-QR, Gäste-QR, Tafel unter dem Einladungsblock |
| [`tv-stage.tsx`](../src/components/game/tv-stage.tsx) | Bigscreen während der Runde und nach einer Begegnung |
| [`styles.css`](../src/styles.css) | Klassen `.qr-frame`, `.qr-slot`, `.cup-*` |

---

## QR-Codes

Ursache für unlesbare Codes war die SVG-Geometrie, nicht der Encoder.

1. `viewBox` begann bei negativen Koordinaten (`-4 -4`). Manche Browser und TV-WebViews schnitten die Finder-Muster ab.
2. `rounded-lg` und `shadow-lift` lagen direkt auf dem SVG und beschnitten die Ecken.
3. Ohne `width`/`height` fiel das SVG in Flex/Grid auf 0 oder ein nicht-quadratisches Seitenverhältnis.

Korrektur:

- Quiet Zone 4 Module, im Pfad als Offset (`qrPath(matrix, 4)`).
- `viewBox="0 0 box box"`, `width` und `height` in Pixeln (8 px pro Modul).
- `shape-rendering="crispEdges"`, `preserveAspectRatio="xMidYMid meet"`.
- Rahmen `.qr-frame`: weißer Hintergrund, `aspect-ratio: 1`, `min-width/min-height: 13rem`, `flex-shrink: 0`. Abrundung am Rahmen, nicht am Modul-Gitter.

Einladungs-URL kommt aus `shareUrl` (öffentliche Origin, lokal LAN-IP). Der Encoder schneidet bei 180 Zeichen; die Invite-Pfade `/i/XXXX` bleiben darunter.

---

## Tafel-Layout

Kein zweispaltiges Grid mehr, das Gruppen und Baum gegeneinander staucht. Reihenfolge von oben nach unten:

1. Live-Zeile (aktuelle Begegnung oder Sieger)
2. Gruppenraster
3. K.o.-Baum

### Gruppen

```css
.cup-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}
```

Unter 640 px eine Spalte. Die laufende Gruppe hat einen Rahmen in Primärfarbe.

### K.o.-Baum

```css
.cup-bracket { display: flex; overflow-x: auto; }
.cup-round   { flex: 0 0 13.5rem; min-width: 13.5rem; }
```

Eine Spalte pro Runde (Achtelfinale, Viertelfinale, Halbfinale, Finale). Jede Begegnung ist eine Karte mit zwei Namen untereinander, Status darunter. Bei vielen Runden scrollt die Zeile horizontal, die Karten bleiben lesbar. `scroll-snap-align: start` hält eine Runde im Blick.

Compact (Handy, Zuschauer): Runden 12 rem breit. Bigscreen (`.cup-board.is-tv`): 16 rem, größere Schrift.

---

## Breakpoints

| Breite | Verhalten |
| --- | --- |
| < 640 px | Eine Gruppenspalte, Baum scrollt seitlich |
| ≥ 640 px | Gruppen `auto-fill` ab 14 rem |
| ≥ 1024 px | QR in `.qr-slot` (bis 22 rem, `flex-shrink: 0`), Text `min-w-0 flex-1`. Tafel volle Breite darunter. Bigscreen-Spielansicht: Vinyl und Spielerliste nebeneinander. |

`min-w-0` an Flex-Kindern verhindert, dass lange Namen das Raster spreizen.

---

## Bigscreen

- Claim- und Invite-Schritt: QR links, Erklärung rechts. Kein `minmax(16rem, 28rem)`-Grid mehr, das den Code zusammendrückt.
- Tafel nach dem Invite-Block, volle Breite.
- Spielansicht: Vinyl und Spielerliste stapeln unter 1024 px, danach nebeneinander. Liste `min-w-0`, ab `sm` mindestens 18 rem.
- Nach einer Begegnung: Podest, darunter dieselbe Tafel mit `.is-tv`.

---

## Anpassen

Farben und Radien kommen aus den bestehenden Tokens (`bg-raised`, `text-muted`, `shadow-border`, `radius-md`). Keine extra Palette für das Turnier.

Schriftgrößen der Tafel nur über `.cup-board.is-tv` und `.cup-board.is-compact` ändern, nicht in den Komponenten duplizieren.
