import { drawText, drawTextCentered, textWidth } from "./font.ts";
import { Canvas } from "./png.ts";

export const OG_W = 1200;
export const OG_H = 630;
export const SITE = "https://jahrgang.vercel.app";

const CREAM = [239, 232, 216];
const MUTED = [154, 147, 136];
const BG = [12, 11, 10];
const VINYL = [16, 14, 12];
const GROOVE = [42, 36, 28];
const LABEL = [239, 232, 216];
const LABEL_INK = [28, 24, 20];
const LABEL_RING = [215, 196, 160];

export function inviteCode(raw?: string | null) {
  const code = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return code.length === 4 ? code : "";
}

function vinyl(c: Canvas, cx: number, cy: number, r: number) {
  c.fillCircle(cx, cy, r + 8, [8, 7, 6]);
  c.fillCircle(cx, cy, r, VINYL);
  for (let i = 10; i < r - 78; i += 9) {
    c.strokeCircle(cx, cy, r - i, GROOVE, 1.5, 0.5);
  }
  c.fillCircle(cx, cy, r * 0.4, LABEL);
  c.strokeCircle(cx, cy, r * 0.34, LABEL_RING, 3, 0.75);
  drawTextCentered(c, "JAHRGANG", cx, cy - r * 0.2, 6, LABEL_INK, 0.28);
  c.fillCircle(cx, cy, 16, BG);
  c.fillCircle(cx, cy, 6, LABEL);
}

export function invitePng(raw?: string | null) {
  const code = inviteCode(raw);
  const s = 2;
  const c = new Canvas(OG_W * s, OG_H * s, BG);
  c.fillRect(0, 0, 8 * s, OG_H * s, [42, 36, 28], 0.55);
  vinyl(c, 300 * s, 315 * s, 228 * s);
  const tx = 580 * s;
  drawText(c, "JAHRGANG", tx, 128 * s, 8 * s, CREAM, 0.32);
  if (code) {
    drawText(c, "EINLADUNG", tx, 214 * s, 4 * s, MUTED, 0.7);
    const codeScale = 16 * s;
    drawText(c, code, tx, 278 * s, codeScale, CREAM, 0.9);
    const lineW = textWidth(code, codeScale, 0.9);
    c.fillRect(tx, 278 * s + 7 * codeScale + 18 * s, lineW, 3 * s, LABEL_RING, 0.85);
    drawText(c, "MITSPIELEN", tx, 478 * s, 4 * s, MUTED, 0.55);
  } else {
    drawText(c, "MUSIK-ZEITSPIEL", tx, 220 * s, 3 * s, MUTED, 0.55);
    drawText(c, "HIT HOEREN.", tx, 320 * s, 5 * s, CREAM, 0.35);
    drawText(c, "JAHR LEGEN.", tx, 390 * s, 5 * s, CREAM, 0.35);
  }
  return c.downscale(s);
}

export function inviteSvg(raw?: string | null) {
  const code = inviteCode(raw);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}" role="img" aria-label="Jahrgang${code ? ` Einladung ${code}` : ""}">
  <rect width="${OG_W}" height="${OG_H}" fill="#0c0b0a"/>
  <rect width="8" height="${OG_H}" fill="#2a241c" opacity="0.55"/>
  <g transform="translate(300 315)">
    <circle r="236" fill="#080706"/>
    <circle r="228" fill="#100e0c"/>
    ${[14, 24, 36, 48, 62, 76, 92, 108, 124, 140].map((n) => `<circle r="${228 - n}" fill="none" stroke="#2a241c" stroke-width="1.3" opacity="0.5"/>`).join("")}
    <circle r="91" fill="#efe8d8"/>
    <circle r="78" fill="none" stroke="#d7c4a0" stroke-width="3"/>
    <text text-anchor="middle" y="-6" fill="#1c1814" font-size="18" font-family="Georgia, 'Times New Roman', serif" font-weight="700" letter-spacing="3">JAHRGANG</text>
    <circle r="16" fill="#0c0b0a"/>
    <circle r="6" fill="#efe8d8"/>
  </g>
  <text x="580" y="176" fill="#efe8d8" font-size="72" font-family="Georgia, 'Times New Roman', serif" font-weight="600" letter-spacing="3">Jahrgang</text>
  ${
    code
      ? `<text x="580" y="228" fill="#9a9388" font-size="26" font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="8">EINLADUNG</text>
  <text x="580" y="360" fill="#efe8d8" font-size="96" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" letter-spacing="16">${code}</text>
  <rect x="580" y="382" width="420" height="3" fill="#d7c4a0"/>
  <text x="580" y="470" fill="#9a9388" font-size="26" font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="4">Mitspielen</text>`
      : `<text x="580" y="228" fill="#9a9388" font-size="22" font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="6">MUSIK-ZEITSPIEL</text>
  <text x="580" y="330" fill="#efe8d8" font-size="36" font-family="Georgia, 'Times New Roman', serif">Hit hören.</text>
  <text x="580" y="384" fill="#efe8d8" font-size="36" font-family="Georgia, 'Times New Roman', serif">Jahr legen.</text>`
  }
</svg>`;
}

export function ogImageUrl(code?: string) {
  return code ? `${SITE}/api/og?room=${code}` : `${SITE}/og.jpg`;
}

export function invitePageUrl(code: string) {
  return `${SITE}/i/${code}`;
}

export function ogMeta(code?: string) {
  const invite = Boolean(code);
  const title = invite ? `Jahrgang · Einladung ${code}` : "Jahrgang";
  const description = invite
    ? `Du bist eingeladen. Raum ${code} öffnen, Hit hören, auf die Zeitlinie legen.`
    : "Jahrgang: Titel hören und nach Erscheinungsjahr auf der Zeitlinie einordnen.";
  const image = ogImageUrl(code);
  const url = invite && code ? invitePageUrl(code) : SITE;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "de_DE" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Jahrgang" },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:width", content: String(OG_W) },
    { property: "og:image:height", content: String(OG_H) },
    { property: "og:image:type", content: invite ? "image/png" : "image/jpeg" },
    { property: "og:image:alt", content: invite ? `Jahrgang Einladung ${code}` : "Jahrgang · Musik-Zeitspiel" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}
