/**
 * Lightweight client-side filter for names and chat.
 * Peers are untrusted, so send and receive both run through this.
 */

const HARD = [
  "nigger",
  "niggers",
  "nigga",
  "niggaz",
  "niggas",
  "niggah",
  "niga",
  "neger",
  "negers",
  "negern",
  "faggot",
  "faggots",
  "kanake",
  "kanaken",
  "schlitzauge",
  "schlitzaugen",
  "hurensohn",
  "hurensoehne",
  "hurensohne",
  "nuttensohn",
  "fotze",
  "fotzen",
  "missgeburt",
  "missgeburten",
  "schwuchtel",
  "schwuchteln",
  "wichser",
  "wichsern",
  "arschloch",
  "arschloecher",
  "arschlocher",
  "drecksau",
  "drecksaeue",
  "tranny",
  "kike",
  "kikes",
  "chink",
  "chinks",
  "wetback",
  "wetbacks",
] as const;

const SOFT = [
  "schlampe",
  "schlampen",
  "hure",
  "huren",
  "nutte",
  "nutten",
  "spast",
  "spasti",
  "spastic",
  "mongo",
  "mongoloid",
  "retard",
  "retards",
  "retarded",
  "cunt",
  "cunts",
  "whore",
  "whores",
  "slut",
  "sluts",
  "fag",
  "fags",
  "nazi",
  "nazis",
  "hitler",
  "zigeuner",
  "itaker",
  "polacke",
  "polacken",
  "hirni",
  "vollidiot",
  "pissnelke",
  "fick",
  "ficken",
  "fickt",
  "fuck",
  "fucking",
  "fucker",
] as const;

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/q/g, "g");
}

function compact(value: string) {
  return fold(value).replace(/[^a-z]+/g, "");
}

function squeeze(value: string) {
  return value.replace(/(.)\1{2,}/g, "$1$1");
}

function words(value: string) {
  return fold(value)
    .split(/[^a-z]+/)
    .filter(Boolean);
}

export function isBlocked(value: string) {
  const packed = squeeze(compact(value));
  if (packed.length < 3) return false;
  if (HARD.some((term) => packed.includes(term))) return true;
  const tokens = words(value).map(squeeze);
  return SOFT.some((term) => tokens.includes(term));
}

export function stripControls(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function cleanName(input: string, max = 18) {
  const raw = stripControls(input).slice(0, max);
  if (isBlocked(raw)) return "";
  return raw;
}

export function safeName(input: string, fallback = "Gast") {
  const next = cleanName(input).trim();
  return next || fallback;
}

export function cleanMessage(input: string, max = 140) {
  const text = stripControls(input).trim().slice(0, max);
  if (!text || isBlocked(text)) return "";
  return text;
}
