const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  const fromUrl = raw.match(/[?&]room=([A-Za-z0-9]+)/i);
  const source = fromUrl?.[1] ?? raw;
  return source.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

export function p2pRoomId(code: string): string {
  return `jg${normalizeRoomCode(code)}`;
}

export function shareUrl(code: string): string {
  if (typeof window === "undefined") return `/?room=${code}`;
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", code);
  return url.toString();
}

export function clearRoomFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("room")) return;
  url.searchParams.delete("room");
  const search = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}
