import { createHash, createHmac, randomBytes } from "node:crypto";
import { SPOTIFY_LIVE } from "./flags.ts";

const SESSION = "jg_spotify";
const PKCE = "jg_sp_pkce";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "streaming",
  "user-modify-playback-state",
  "user-read-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
].join(" ");

export type SpotifySession = {
  access: string;
  refresh: string;
  exp: number;
  name: string;
  product: string;
  id: string;
};

function env(key: string) {
  return process.env[key]?.trim() || "";
}

export function spotifyConfigured() {
  return Boolean(env("SPOTIFY_CLIENT_ID") && env("SPOTIFY_CLIENT_SECRET"));
}

function secret() {
  return env("BETTER_AUTH_SECRET") || env("SPOTIFY_CLIENT_SECRET") || "jahrgang-spotify-dev";
}

function sign(payload: string) {
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verify(token: string) {
  const cut = token.lastIndexOf(".");
  if (cut <= 0) return null;
  const payload = token.slice(0, cut);
  const mac = token.slice(cut + 1);
  const expect = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (mac.length !== expect.length) return null;
  let ok = 0;
  for (let i = 0; i < mac.length; i++) ok |= mac.charCodeAt(i) ^ expect.charCodeAt(i);
  return ok === 0 ? payload : null;
}

/** Spotify rejects `localhost` as redirect URI; loopback must be 127.0.0.1. */
export function loopbackHost(host: string) {
  const match = host.match(/^(localhost)(:\d+)?$/i);
  if (match) return `127.0.0.1${match[2] ?? ""}`;
  return host;
}

export function originOf(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = loopbackHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host,
  );
  return `${proto}://${host}`;
}

function redirectUri(origin: string) {
  return env("SPOTIFY_REDIRECT_URI") || `${origin}/api/spotify/callback`;
}

function isSecure(origin: string) {
  return origin.startsWith("https:");
}

function cookie(name: string, value: string, maxAge: number, secure: boolean) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function pack(value: unknown) {
  return sign(Buffer.from(JSON.stringify(value), "utf8").toString("base64url"));
}

function unpack<T>(token: string): T | null {
  const payload = verify(token);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function publicUser(session: SpotifySession | null) {
  if (!session) return null;
  return { name: session.name, product: session.product, id: session.id };
}

export function readSession(request: Request): SpotifySession | null {
  if (!SPOTIFY_LIVE) return null;
  const raw = readCookie(request, SESSION);
  if (!raw) return null;
  const row = unpack<SpotifySession>(raw);
  if (!row?.access || !row.refresh) return null;
  return row;
}

export function sessionCookie(origin: string, session: SpotifySession) {
  return cookie(SESSION, pack(session), 60 * 60 * 24 * 30, isSecure(origin));
}

export function clearSessionCookie() {
  return `${SESSION}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function b64url(buf: Buffer) {
  return buf.toString("base64url");
}

export function beginLogin(request: Request) {
  if (!SPOTIFY_LIVE || !spotifyConfigured()) return null;
  const origin = originOf(request);
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = b64url(randomBytes(16));
  const params = new URLSearchParams({
    client_id: env("SPOTIFY_CLIENT_ID"),
    response_type: "code",
    redirect_uri: redirectUri(origin),
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  const pkce = cookie(PKCE, pack({ verifier, state }), 600, isSecure(origin));
  return {
    url: `https://accounts.spotify.com/authorize?${params}`,
    pkce,
  };
}

async function tokenRequest(body: URLSearchParams) {
  const id = env("SPOTIFY_CLIENT_ID");
  const secretVal = env("SPOTIFY_CLIENT_SECRET");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secretVal}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
}

async function fetchMe(access: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${access}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    id?: string;
    display_name?: string;
    product?: string;
  };
  if (!json.id) return null;
  return {
    id: json.id,
    name: json.display_name || "Spotify",
    product: json.product || "free",
  };
}

export async function finishLogin(request: Request, code: string, state: string) {
  if (!SPOTIFY_LIVE) return null;
  const origin = originOf(request);
  const pkce = unpack<{ verifier: string; state: string }>(readCookie(request, PKCE));
  if (!pkce || pkce.state !== state || !code) return null;
  const json = await tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(origin),
      code_verifier: pkce.verifier,
    }),
  );
  if (!json?.access_token) return null;
  const me = await fetchMe(json.access_token);
  if (!me) return null;
  const session: SpotifySession = {
    access: json.access_token,
    refresh: json.refresh_token || "",
    exp: Date.now() + (json.expires_in ?? 3600) * 1000,
    name: me.name,
    product: me.product,
    id: me.id,
  };
  return {
    session,
    cookies: [
      sessionCookie(origin, session),
      `${PKCE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    ],
  };
}

export async function refreshSession(request: Request): Promise<SpotifySession | null> {
  const current = readSession(request);
  if (!current) return null;
  if (Date.now() < current.exp - 60_000) return current;
  if (!current.refresh) return current;
  const json = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refresh,
    }),
  );
  if (!json?.access_token) return current;
  return {
    ...current,
    access: json.access_token,
    refresh: json.refresh_token || current.refresh,
    exp: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
}

export async function liveAccessToken(request: Request): Promise<string | null> {
  const session = await refreshSession(request);
  return session?.access ?? null;
}
