import { drawText } from "./font.ts";
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
const LABEL_RING = [215, 196, 160];

export function inviteCode(raw?: string | null) {
  const code = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return code.length === 4 ? code : "";
}

function vinyl(c: Canvas, cx: number, cy: number, r: number) {
  c.fillCircle(cx, cy, r + 6, [8, 7, 6]);
  c.fillCircle(cx, cy, r, VINYL);
  for (let i = 8; i < r - 70; i += 10) {
    c.strokeCircle(cx, cy, r - i, GROOVE, 1.4, 0.45);
  }
  c.fillCircle(cx, cy, r * 0.38, LABEL);
  c.strokeCircle(cx, cy, r * 0.32, LABEL_RING, 3, 0.7);
  c.fillCircle(cx, cy, 18, BG);
  c.fillCircle(cx, cy, 7, LABEL);
}

export function invitePng(raw?: string | null) {
  const code = inviteCode(raw);
  const s = 2;
  const c = new Canvas(OG_W * s, OG_H * s, BG);
  c.fillRect(0, 0, 8 * s, OG_H * s, [42, 36, 28], 0.5);
  vinyl(c, 318 * s, 315 * s, 236 * s);
  const tx = 620 * s;
  drawText(c, "JAHRGANG", tx, 148 * s, 8 * s, CREAM, 0.35);
  if (code) {
    drawText(c, "EINLADUNG", tx, 230 * s, 4 * s, MUTED, 0.6);
    drawText(c, code, tx, 300 * s, 14 * s, CREAM, 0.85);
    drawText(c, "MITSPIELEN", tx, 460 * s, 4 * s, MUTED, 0.55);
  } else {
    drawText(c, "MUSIK ZEITSPIEL", tx, 246 * s, 4 * s, MUTED, 0.45);
    drawText(c, "TITEL HOEREN", tx, 340 * s, 5 * s, CREAM, 0.4);
    drawText(c, "JAHR LEGEN", tx, 400 * s, 5 * s, CREAM, 0.4);
  }
  return c.downscale(s);
}

export function inviteSvg(raw?: string | null) {
  const code = inviteCode(raw);
  const title = code ? "Einladung" : "Musik-Zeitspiel";
  const kicker = code ? code.split("").join(" ") : "";
  const sub = code ? "Mitspielen im Raum." : "Hit hören, Jahr legen.";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}" role="img" aria-label="Jahrgang${code ? ` Raum ${code}` : ""}">
  <rect width="${OG_W}" height="${OG_H}" fill="#0c0b0a"/>
  <rect width="8" height="${OG_H}" fill="#2a241c" opacity="0.55"/>
  <g transform="translate(318 315)">
    <circle r="242" fill="#080706"/>
    <circle r="236" fill="#100e0c"/>
    ${[12, 22, 32, 44, 56, 68, 82, 96, 110, 126, 142, 158].map((n) => `<circle r="${236 - n}" fill="none" stroke="#2a241c" stroke-width="1.2" opacity="0.45"/>`).join("")}
    <circle r="90" fill="#efe8d8"/>
    <circle r="76" fill="none" stroke="#d7c4a0" stroke-width="3"/>
    <circle r="18" fill="#0c0b0a"/>
    <circle r="7" fill="#efe8d8"/>
  </g>
  <text x="620" y="188" fill="#efe8d8" font-size="72" font-family="Georgia, 'Times New Roman', serif" font-weight="600" letter-spacing="4">Jahrgang</text>
  <text x="620" y="236" fill="#9a9388" font-size="28" font-family="ui-sans-serif, system-ui, sans-serif" letter-spacing="6">${title.toUpperCase()}</text>
  ${
    code
      ? `<text x="620" y="360" fill="#efe8d8" font-size="92" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" letter-spacing="18">${kicker}</text>`
      : `<text x="620" y="330" fill="#efe8d8" font-size="36" font-family="Georgia, 'Times New Roman', serif">Hit hören.</text>
  <text x="620" y="384" fill="#efe8d8" font-size="36" font-family="Georgia, 'Times New Roman', serif">Jahr legen.</text>`
  }
  <text x="620" y="500" fill="#9a9388" font-size="26" font-family="ui-sans-serif, system-ui, sans-serif">${sub}</text>
</svg>`;
}

export function ogImageUrl(code?: string) {
  return code ? `${SITE}/api/og?room=${code}` : `${SITE}/api/og`;
}

export function invitePageUrl(code: string) {
  return `${SITE}/?room=${code}`;
}

export function ogMeta(code?: string) {
  const invite = Boolean(code);
  const title = invite ? `Jahrgang · Raum ${code}` : "Jahrgang";
  const description = invite
    ? `Du bist eingeladen. Code ${code} öffnen, Hit hören, auf die Zeitlinie legen.`
    : "Jahrgang: Titel hören und nach Erscheinungsjahr auf der Zeitlinie einordnen.";
  const image = ogImageUrl(code);
  const url = invite && code ? invitePageUrl(code) : SITE;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Jahrgang" },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:width", content: String(OG_W) },
    { property: "og:image:height", content: String(OG_H) },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:alt", content: title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}
