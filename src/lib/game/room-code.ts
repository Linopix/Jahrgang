const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PUBLIC_SITE = "https://jahrgang.vercel.app";

export function makeRoomCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  let code = "";
  for (const n of buf) code += ALPHABET[n % ALPHABET.length];
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

export function isLoopbackHost(host: string): boolean {
  const name = host.replace(/^\[|\]$/g, "").toLowerCase();
  return name === "localhost" || name === "127.0.0.1" || name === "::1" || name === "0.0.0.0";
}

export function isLanHost(host: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

export function isEphemeralHost(host: string): boolean {
  const name = host.toLowerCase();
  return (
    isLoopbackHost(name) ||
    name.endsWith(".local") ||
    name.includes("grok-sandbox") ||
    name.includes("grok-preview")
  );
}

export function invitePath(code: string, opts?: { host?: boolean }): string {
  const room = normalizeRoomCode(code);
  return opts?.host ? `/i/${room}?host=1` : `/i/${room}`;
}

export function originOf(href?: string): string {
  if (href) {
    try {
      return new URL(href).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return PUBLIC_SITE;
}

export function shareOrigin(href?: string): string {
  const origin = originOf(href);
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return PUBLIC_SITE;
  }
  if (host.includes("grok-sandbox") || host.includes("grok-preview")) return PUBLIC_SITE;
  return origin;
}

export function shareUrl(code: string, opts?: { host?: boolean; origin?: string }): string {
  const path = invitePath(code, opts);
  const origin = opts?.origin ?? (typeof window === "undefined" ? "" : shareOrigin());
  if (!origin) return path;
  try {
    return new URL(path, origin).toString();
  } catch {
    return path;
  }
}

export function wantsHostClaim(raw?: string | null): boolean {
  if (!raw) return false;
  return /(?:[?&]host=1(?:&|$))|(?:[?&]host=1$)/i.test(raw) || raw === "1";
}

export function clearRoomFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const invitePathMatch = /^\/i\/[A-Za-z0-9]+$/i.test(url.pathname);
  if (!url.searchParams.has("room") && !url.searchParams.has("host") && !invitePathMatch) return;
  url.searchParams.delete("room");
  url.searchParams.delete("host");
  if (invitePathMatch) url.pathname = "/";
  const search = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

export async function probeLanOrigin(timeoutMs = 900): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isLoopbackHost(window.location.hostname)) return null;
  if (!window.RTCPeerConnection) return null;
  const port = window.location.port;
  const protocol = window.location.protocol;
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    let done = false;
    const finish = (origin: string | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      pc.close();
      resolve(origin);
    };
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    pc.createDataChannel("lan");
    pc.onicecandidate = (event) => {
      const cand = event.candidate?.candidate ?? "";
      const match = cand.match(
        /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/,
      );
      const ip = match?.[1] ?? "";
      if (ip && isLanHost(ip)) {
        finish(`${protocol}//${ip}${port ? `:${port}` : ""}`);
      }
    };
    void pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => finish(null));
  });
}
