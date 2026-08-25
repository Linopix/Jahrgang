import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";

const COOKIE = "jg_discord";
const STATE_COOKIE = "jg_discord_state";
const MAX_AGE = 60 * 60 * 24 * 30;

export type DiscordProfile = {
  id: string;
  username: string;
  avatar: string | null;
};

function env(key: string) {
  const value = process.env[key]?.trim();
  return value || undefined;
}

export function discordOAuthReady() {
  return Boolean(env("DISCORD_CLIENT_ID") && env("DISCORD_CLIENT_SECRET"));
}

export function discordClientId() {
  return env("DISCORD_CLIENT_ID") ?? "";
}

function secret() {
  return env("DISCORD_CLIENT_SECRET") ?? env("BETTER_AUTH_SECRET") ?? "jahrgang-discord-dev";
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
  const a = Buffer.from(mac);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return payload;
}

function cookie(name: string, value: string, maxAge: number, secure: boolean) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function clearCookie(name: string) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function isSecure(request: Request) {
  return originOf(request).startsWith("https:");
}

export function profileCookie(request: Request, profile: DiscordProfile) {
  const payload = Buffer.from(JSON.stringify(profile), "utf8").toString("base64url");
  return cookie(COOKIE, sign(payload), MAX_AGE, isSecure(request));
}

export function stateCookie(request: Request, state: string) {
  return cookie(STATE_COOKIE, sign(state), 600, isSecure(request));
}

export function clearDiscordCookies() {
  return [clearCookie(COOKIE), clearCookie(STATE_COOKIE)];
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function readDiscordProfile(request: Request): DiscordProfile | null {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  try {
    const row = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DiscordProfile;
    if (!row?.id || !row?.username) return null;
    return row;
  } catch {
    return null;
  }
}

export function readOAuthState(request: Request) {
  const token = readCookie(request, STATE_COOKIE);
  if (!token) return "";
  return verify(token) ?? "";
}

export function originOf(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export function authorizeUrl(request: Request, state: string) {
  const id = discordClientId();
  const redirect = `${originOf(request)}/api/discord/callback`;
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export function mintState() {
  return randomBytes(16).toString("hex");
}

export async function exchangeCode(request: Request, code: string): Promise<DiscordProfile> {
  const id = discordClientId();
  const secretVal = env("DISCORD_CLIENT_SECRET");
  if (!id || !secretVal) throw new Error("Discord ist nicht eingerichtet.");
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secretVal,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${originOf(request)}/api/discord/callback`,
  });
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error("Discord-Anmeldung fehlgeschlagen.");
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Discord-Anmeldung fehlgeschlagen.");
  const meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw new Error("Discord-Profil nicht lesbar.");
  const me = (await meRes.json()) as { id?: string; username?: string; global_name?: string; avatar?: string | null };
  if (!me.id || !me.username) throw new Error("Discord-Profil unvollständig.");
  return {
    id: me.id,
    username: (me.global_name || me.username).slice(0, 18),
    avatar: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=64` : null,
  };
}

export async function ensureScoresTable() {
  const sql = await getSql();
  await sql.query(
    `CREATE TABLE IF NOT EXISTS jahrgang_scores (
      id TEXT PRIMARY KEY,
      discord_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      wins INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      heard INTEGER NOT NULL DEFAULT 0,
      placed_ok INTEGER NOT NULL DEFAULT 0,
      variant TEXT NOT NULL DEFAULT 'timeline',
      played_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
}
