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

export function shareUrl(code: string, opts?: { host?: boolean }): string {
  if (typeof window === "undefined") {
    return opts?.host ? `/?room=${code}&host=1` : `/?room=${code}`;
  }
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("room", code);
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
  if (!url.searchParams.has("room") && !url.searchParams.has("host")) return;
  url.searchParams.delete("room");
  url.searchParams.delete("host");
  const search = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}
