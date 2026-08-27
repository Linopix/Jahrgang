# Turnier

Jahrgang kann einen Abend als Turnier spielen: zuerst Gruppen, danach K.o. Der Modus ist ein eigener Punkt im Hauptmenü (**Turnier**). Ein normaler Online-Abend oder Bigscreen startet kein Turnier.

Der Modus ist **eingebaut und an**. Wer ihn aus dem Produkt nehmen will, setzt in [`src/lib/tournament/flags.ts`](../src/lib/tournament/flags.ts) `TOURNAMENT_LIVE` auf `false` (gleicher Wert wie `TOURNAMENT_MODE_ENABLED`). Dann verschwinden Menüpunkt, Tafel und Netz-Nachrichten.

Darstellung, QR und CSS: **[turnier-ui.md](turnier-ui.md)**.

---

## Bedienung

1. Startseite: **Turnier**. Es öffnet sich die Bühne (Bigscreen). Pack, Ablauf und Ton stellst du auf diesem Bildschirm ein.
2. Mitspieler kommen per QR oder Code dazu. Die Handys spielen und tragen Ergebnisse ein. Sie stellen das Turnier nicht ein und starten es nicht.
3. Ablauf: **Nacheinander** (eine Begegnung, Ton vom Bigscreen) oder **Gleichzeitig** (alle Gruppen dieser Runde parallel, Ton auf einem oder allen Handys der Gruppe).
4. **Turnier starten**. Es laufen eine oder mehrere Begegnungen, je nach Ablauf.
5. Nach einer Begegnung: Podest, dann weiter. Gleichstand im K.o.: Stechen mit Ziel 2.
6. Nach dem Finale: Sieger, zurück in die Lobby.

Eine Begegnung ist eine normale Jahrgang-Runde nur mit den Personen dieser Gruppe oder diesem K.o.-Paar.

Der Stapel einer Begegnung enthält **alle Titel der gewählten Packs, für die eine Hörprobe gefunden wird**. Es gibt keine Kürzung auf 80 Titel wie in einer normalen Runde. Die Hörproben werden beim ersten Start geladen und für die weiteren Begegnungen des Abends wiederverwendet. Wer Pack, Mix oder Playlist ändert, löst den Vorrat neu.

---

## Steuerung und Netz

Die Bühne (`role: host`) rechnet und sendet den Stand. Handys sind Gäste: sie senden Züge, nicht Konfiguration. Für die Ausfallsicherheit bleiben sie Peers im Stern. Fällt die Bühne aus, übernimmt das nächste Gerät die Rechnung (wie bisher, 12 s).

`adminId` im Turnier ist die Bühne. Host-Rechte werden nicht an ein Handy übergeben.

---

## Ablauf und Ton

| Ablauf | Ton |
| --- | --- |
| Nacheinander (`cupFlow: seq`) | Nur Bigscreen (`cupAudio: stage`) |
| Gleichzeitig (`cupFlow: par`) | Ein Handy pro Gruppe (`one`) oder alle Handys der Gruppe (`all`). Die Bühne spielt keinen Titel. |

Welches Handy bei `one` den Ton hat: erstes Mitglied der Begegnung (`cupSpeakers[matchId]`).

---

## Gruppen


`planGroupSizes(n, prefer)` in [`groups.ts`](../src/lib/tournament/groups.ts).

Auto (Standard): möglichst viele Vierer.

| Rest bei Division durch 4 | Auflösung |
| --- | --- |
| 0 | nur Vierer |
| 1 | zwei Vierer weniger, drei Dreier (sonst gäbe es eine 1er-Gruppe) |
| 2 | ein Vierer weniger, zwei Dreier |
| 3 | eine Dreiergruppe extra |

Beispiele: 20 → fünf Vierer. 21 → drei Vierer + drei Dreier. 22 → vier Vierer + zwei Dreier. 30 → sechs Vierer + zwei Dreier.

3er-Vorgabe: möglichst Dreier, Rest 1 wird ein Vierer, Rest 2 zwei Vierer.

Eine einzige Gruppe (4 oder 5 Personen bei Auto): kein K.o. Die Reihenfolge dieser einen Runde ist das Turnier.

---

## K.o. und Freilose

Nach allen Gruppenspielen: `qualify` Personen pro Gruppe, Gruppensieger zuerst, danach die Zweiten nach Karten/Ratepunkten sortiert.

Die Qualifikanten füllen ein Feld auf die nächste Zweierpotenz (8, 16, …). Leere Plätze sind Freilose: die gesetzte Person steht in der nächsten Runde, ohne zu spielen.

10 Qualifikanten → Feld 16, sechs Freilose, dann Viertelfinale mit acht.

Paarung der ersten K.o.-Runde: 1 gegen Letzten, 2 gegen Vorletzten.

Rundennamen: Achtelfinale, Viertelfinale, Halbfinale, Finale — je nach Feldgröße. Kein Spiel um Platz 3.

---

## Daten

[`types.ts`](../src/lib/tournament/types.ts)

```
Tournament
  rev            steigt bei jeder Änderung (ältere Stände werden verworfen)
  status         idle | groups | knockout | done
  groupPref      auto | 3 | 4
  qualify        1 | 2
  players[]      id, name
  groups[]       label A…, playerIds, table[], matchId
  matches[]      siehe unten
  currentMatchId
  championId

Match
  kind           group | knockout
  round          group | r16 | qf | sf | final
  playerIds
  winnerIds
  status         pending | live | done
  bye, stechen
  nextMatchId, nextSlot   Verkettung im Baum
```

JSON ist dasselbe Objekt. `parseTournament` in [`wire.ts`](../src/lib/tournament/wire.ts) liest es defensiv.

In der Lobby liegt nur die Einstellung:

```
RoomConfig.cup          false = normale Runde
RoomConfig.cupSize      auto | 3 | 4
RoomConfig.cupQualify   1 | 2
```

Der laufende Stand ist **nicht** Teil von `RoomConfig`. Er liegt in `useOnline.tournament` und fährt mit:

| Nachricht | Wann |
| --- | --- |
| `{ t: "lobby", cup, cupSize, cupQualify, tournament }` | Host verteilt Lobby |
| `{ t: "cup", tournament }` | nach jeder Änderung (Start, Ergebnis, Freilos) |
| `{ t: "state", snapshot }` | unverändert: die aktuelle Begegnung |

Gäste wenden `cup` an, wenn die Nachricht vom Host kommt. `rev` steigt, ein älterer Stand überschreibt keinen neueren nicht explizit — der Host ist Quelle.

---

## Wo der Code andockt

Bestehende Runde bleibt unangetastet, solange `cup` aus ist.

| Stelle | Rolle |
| --- | --- |
| `requestStartOnline` | bei `cup` → `requestStartCup`: Turnier anlegen oder nächste offene Begegnung starten, `startGame` nur mit diesen IDs |
| `requestFinishCupMatch` | Host, wenn die Begegnung im Podest landet: `completeMatch` + `{ t: "cup" }` |
| `requestAgain` | nächste Begegnung oder Stechen |
| `game-options.tsx` | Schalter, nur wenn `TOURNAMENT_LIVE` und Online |
| `tournament-board.tsx` | Tafel für Lobby, Podest, Bigscreen, Zuschauer |
| `app.tsx` | wer nicht in `players` der laufenden Begegnung ist, sieht `TournamentWatch` |
| `playerSeats(..., cup)` | bei Turnier bis 32 Plätze, sonst 8 |
| `online-bridge.tsx` | `cup` in Lobby, Relais für Chat/Reaktion/Aim im Stern, Host-Nachfolge |

Engine ohne React: [`engine.ts`](../src/lib/tournament/engine.ts). Tests: `src/lib/tournament/tournament.test.ts`.

---

## P2P, Host-Ausfall

Normale Runden (bis acht): volles Mesh wie bisher. Jedes Gerät hat eine Verbindung zu jedem anderen.

Turnier (Schalter an): **Stern**. Gäste verbinden sich nur mit dem Host. Der Host hat eine Verbindung je Gast. Chat, Reaktionen und der Zielschlitz (`aim`) gehen zum Host und von dort mit `by` (Original-Absender) weiter. Ohne Relais würden sich die Handys untereinander nicht sehen.

Erkennung, dass der Host weg ist:

1. Die WebRTC-Verbindung zum Host fällt (ICE).
2. Zusätzlich listet `/api/rtc` alle Geräte, die noch pollen. Das ist die Anwesenheitsliste, unabhängig vom Mesh. `P2PRoom.rosterList()` gibt sie zurück. ICE-Ping alle 2 s bleibt der Verbindungstest zum aktuellen Hub.

12 Sekunden Schonfrist (`HOST_GRACE_MS`), gleicher `selfId` → wieder da, `hello resume`.

Danach wählt jedes Gerät denselben Nachfolger (`pickSuccessor` / `shouldTakeHost`), diesmal über den Signaling-Roster, nicht über die direkten Peer-Verbindungen (die hat ein Gast im Stern nur zum toten Host).

- Wer Nachfolger ist: `becomeHost`, `setHub(self)`, schickt `host-take`, `state`, `cup`.
- Wer nicht: setzt `hostId` auf den Nachfolger und `setHub(nachfolger)`. Signaling kennt den Peer, die Verbindung entsteht neu.

Der Turnierstand liegt auf allen Geräten (letzte `cup`-Nachricht). Der neue Host rechnet mit diesem Stand weiter. Kein Extra-Server.

Die Bühne (Bigscreen) wird nicht Nachfolger, solange ein Handy lebt — gleiche Regel wie ohne Turnier.

---

## Ausschalten

```ts
// src/lib/tournament/flags.ts
export const TOURNAMENT_LIVE = false;
```

Bauen und ausliefern. UI und `t: "cup"` werden ignoriert. `CUP_MIN` (4) und `CUP_MAX` (32) stehen in derselben Datei.
