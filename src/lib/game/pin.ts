/**
 * Optionale Raum-PIN. Nur der Host sieht den Schalter, und nur wenn dieses
 * Flag an ist. false: keine UI, hello prüft nichts.
 *
 * Die PIN steht nicht im Einladungslink. Signaling bleibt am Raumcode;
 * ohne richtige PIN nimmt der Host den Gast nicht in die Runde.
 */
export const ROOM_PIN_LIVE = true;

export const PIN_LEN = 4;

export function normalizePin(raw: string) {
  return raw.replace(/\D/g, "").slice(0, PIN_LEN);
}

export function pinReady(pin: string) {
  return pin.length === PIN_LEN;
}

export function makePin() {
  const buf = new Uint8Array(PIN_LEN);
  crypto.getRandomValues(buf);
  let pin = "";
  for (const n of buf) pin += String(n % 10);
  return pin;
}

/** Leere Host-PIN heißt: nicht verlangt. */
export function pinMatch(got: string, expect: string) {
  if (!ROOM_PIN_LIVE) return true;
  if (!expect) return true;
  const a = normalizePin(got);
  if (a.length !== expect.length) return false;
  return a === expect;
}
