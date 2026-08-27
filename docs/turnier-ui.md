# Turnier-Oberfläche

Diese Datei beschreibt die Darstellung: Menü, Setup auf der Bühne, Tafel, K.o.-Baum, parallele Begegnungen, QR-Codes und das Feature-Flag. Ablauf, Gruppenlogik und P2P stehen in [turnier.md](turnier.md).

---

## Feature-Flag

In [`src/lib/tournament/flags.ts`](../src/lib/tournament/flags.ts):

```ts
export const TOURNAMENT_LIVE = true;
export { TOURNAMENT_LIVE as TOURNAMENT_MODE_ENABLED };
```

`false` blendet aus:

- Menüpunkt **Turnier** auf der Startseite
- Tafel, Gitter, Netz-Nachrichten `cup` / `cup-table` / `cup-board`

Ein normaler Online-Abend oder Bigscreen bleibt unverändert (kein Turnier-Schalter dort).

---

## Menü und Setup

Startseite: Button **Turnier** neben **Online-Abend**. Er setzt `cupIntent` und öffnet die Bühne direkt im Setup (`tvStep: "setup"`, `adminId` = Bühne). Der Claim-Schritt für ein Host-Handy entfällt.

Setup nur auf dem Bigscreen: Pack, Stil, **Ablauf** (Nacheinander / Gleichzeitig), bei gleichzeitig **Ton** (ein Handy pro Gruppe / alle Handys), Gruppengröße, Qualifikation. Start und Kick nur dort. Handys sehen QR, Code und die Teilnehmerliste ohne Steuerknöpfe.

---

## QR-Codes

Rahmen `.qr-frame`: weißes Quadrat, Quiet Zone 4 Module, `viewBox` ab 0, 8 px pro Modul, `min-width: 13rem`, `flex-shrink: 0`. Abrundung am Rahmen, nicht am Gitter. URL aus `shareUrl`.

---

## Tafel und parallele Begegnungen

Nacheinander: wie bisher eine Begegnung, Vinyl und Linie auf der Bühne.

Gleichzeitig: [`TvCupGridScreen`](../src/components/game/tv-stage.tsx) mit `.cup-live-grid` (`auto-fit`, min. 16 rem). Jede Karte: Namen, Karten, Ratepunkte, wer dran ist. Darunter die Tafel (Gruppenraster + K.o.-Spalten, horizontal scrollbar).

Stände kommen als `{ t: "cup-board", boards }` an alle Geräte. Den vollen Spielstand einer Begegnung (`cup-table` / `state`) bekommen nur die Personen darin.

---

## Ton

`canPlayCue` in [`mode.ts`](../src/lib/tv/mode.ts):

- Nacheinander: nur die Bühne
- Gleichzeitig: Bühne still. `one` = `cupSpeakers[matchId]`, `all` = jedes Handy der Begegnung

SFX bleiben unverändert.

---

## Breakpoints

| Breite | Verhalten |
| --- | --- |
| < 640 px | Eine Gruppenspalte, Baum scrollt seitlich, Gitter eine Karte |
| ≥ 640 px | Gruppen und Live-Karten `auto-fill` ab 14–16 rem |
| ≥ 1024 px | QR in `.qr-slot` (nicht stauchbar), Text `min-w-0 flex-1`. Tafel volle Breite darunter. |

---

## Dateien

| Datei | Aufgabe |
| --- | --- |
| [`home-screen.tsx`](../src/components/game/home-screen.tsx) | Menüpunkt Turnier |
| [`online-entry-screen.tsx`](../src/components/game/online-entry-screen.tsx) | Einstieg ohne Bigscreen-Schalter |
| [`game-options.tsx`](../src/components/game/game-options.tsx) | Ablauf, Ton, Gruppen nur wenn `cup` |
| [`tv-lobby.tsx`](../src/components/game/tv-lobby.tsx) | Setup und QR auf der Bühne |
| [`tv-stage.tsx`](../src/components/game/tv-stage.tsx) | Gitter für parallele Begegnungen |
| [`tournament-board.tsx`](../src/components/game/tournament-board.tsx) | Gruppen + K.o. |
| [`qr-code.tsx`](../src/components/game/qr-code.tsx) | SVG-QR |
| [`styles.css`](../src/styles.css) | `.qr-frame`, `.cup-*`, `.cup-live-*` |
