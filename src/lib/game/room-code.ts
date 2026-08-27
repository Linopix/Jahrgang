const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  const fromPath = raw.match(/\/i\/([A-Za-z0-9]+)/i);
  const fromUrl = raw.match(/[?&]room=([A-Za-z0-9]+)/i);
  const source = fromPath?.[1] ?? fromUrl?.[1] ?? raw;
  return source.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}

export function p2pRoomId(code: string): string {
  return `jg${normalizeRoomCode(code)}`;
}

export function shareUrl(code: string, opts?: { host?: boolean }): string {
  const room = normalizeRoomCode(code);
  if (typeof window === "undefined") {
    return opts?.host ? `/i/${room}?host=1` : `/i/${room}`;
  }
  const url = new URL(window.location.href);
  url.pathname = `/i/${room}`;
  url.search = "";
  url.hash = "";
  if (opts?.host) url.searchParams.set("host", "1");
  return url.toString();
}

export function wantsHostClaim(raw?: string | null): boolean {
  if (!raw) return false;
  return /(?:[?&]host=1(?:&|$))|(?:[?&]host=1$)/i.test(raw) || raw === "1";
}

export function clearRoomFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const invitePath = /^\/i\/[A-Za-z0-9]+$/i.test(url.pathname);
  if (!url.searchParams.has("room") && !url.searchParams.has("host") && !invitePath) return;
  url.searchParams.delete("room");
  url.searchParams.delete("host");
  if (invitePath) url.pathname = "/";
  const search = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}
