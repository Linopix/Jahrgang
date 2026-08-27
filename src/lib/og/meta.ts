export const OG_W = 1200;
export const OG_H = 630;
export const SITE = "https://jahrgang.vercel.app";

export function inviteCode(raw?: string | null) {
  const code = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return code.length === 4 ? code : "";
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
