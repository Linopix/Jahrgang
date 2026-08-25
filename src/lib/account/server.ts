import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import type { Account, AccountStats, BoardRange, BoardRow } from "./types";

export type { Account, AccountStats, BoardRange, BoardRow } from "./types";

const COOKIE = "jg_konto";
const MAX_AGE = 60 * 60 * 24 * 30;

function env(key: string) {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function secret() {
  return env("BETTER_AUTH_SECRET") ?? env("DATABASE_URL") ?? "jahrgang-konto-dev";
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

export function originOf(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

function isSecure(request: Request) {
  return originOf(request).startsWith("https:");
}

function cookie(name: string, value: string, maxAge: number, secure: boolean) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function sessionCookie(request: Request, account: Account) {
  const payload = Buffer.from(JSON.stringify(account), "utf8").toString("base64url");
  return cookie(COOKIE, sign(payload), MAX_AGE, isSecure(request));
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function readAccount(request: Request): Account | null {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  try {
    const row = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Account;
    if (!row?.id || !row?.name) return null;
    return row;
  } catch {
    return null;
  }
}

export function nameKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function cleanName(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, 18);
}

function hashSecret(value: string, salt: string) {
  return scryptSync(value, salt, 32).toString("base64url");
}

export async function ensureAccountTables() {
  const sql = await getSql();
  await sql.query(
    `CREATE TABLE IF NOT EXISTS jahrgang_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
  await sql.query(
    `CREATE TABLE IF NOT EXISTS jahrgang_board (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      wins INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      heard INTEGER NOT NULL DEFAULT 0,
      placed_ok INTEGER NOT NULL DEFAULT 0,
      variant TEXT NOT NULL DEFAULT 'timeline',
      played_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
  await sql.query(
    `CREATE INDEX IF NOT EXISTS jahrgang_board_played ON jahrgang_board (played_at DESC)`,
  );
  await sql.query(
    `CREATE INDEX IF NOT EXISTS jahrgang_board_account ON jahrgang_board (account_id)`,
  );
}

const attempts = new Map<string, { n: number; at: number }>();

export function rateOk(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const row = attempts.get(ip);
  if (!row || now - row.at > 10 * 60_000) {
    attempts.set(ip, { n: 1, at: now });
    return true;
  }
  if (row.n >= 12) return false;
  row.n += 1;
  return true;
}

export async function registerAccount(name: string, secretWord: string) {
  const cleaned = cleanName(name);
  const key = nameKey(cleaned);
  if (cleaned.length < 2 || key.length < 2) throw new Error("Name ist zu kurz.");
  if (secretWord.trim().length < 6) throw new Error("Geheimwort mindestens sechs Zeichen.");
  await ensureAccountTables();
  const sql = await getSql();
  const exists = await sql.query<{ id: string }>(
    `SELECT id FROM jahrgang_accounts WHERE name_key = $1 LIMIT 1`,
    [key],
  );
  if (exists[0]) throw new Error("Der Name ist schon vergeben.");
  const salt = randomBytes(16).toString("base64url");
  const account: Account = { id: randomBytes(12).toString("hex"), name: cleaned };
  await sql.query(
    `INSERT INTO jahrgang_accounts (id, name, name_key, salt, hash) VALUES ($1,$2,$3,$4,$5)`,
    [account.id, cleaned, key, salt, hashSecret(secretWord, salt)],
  );
  return account;
}

export async function loginAccount(name: string, secretWord: string) {
  const key = nameKey(name);
  if (!key) throw new Error("Name fehlt.");
  await ensureAccountTables();
  const sql = await getSql();
  const rows = await sql.query<{ id: string; name: string; salt: string; hash: string }>(
    `SELECT id, name, salt, hash FROM jahrgang_accounts WHERE name_key = $1 LIMIT 1`,
    [key],
  );
  const row = rows[0];
  if (!row) throw new Error("Name oder Geheimwort stimmt nicht.");
  const got = Buffer.from(hashSecret(secretWord, row.salt));
  const expect = Buffer.from(row.hash);
  if (got.length !== expect.length || !timingSafeEqual(got, expect)) {
    throw new Error("Name oder Geheimwort stimmt nicht.");
  }
  return { id: row.id, name: row.name } satisfies Account;
}

export async function saveBoard(
  account: Account,
  input: { wins: number; points: number; heard: number; placedOk: number; variant: string },
) {
  await ensureAccountTables();
  const sql = await getSql();
  await sql.query(
    `INSERT INTO jahrgang_board
      (id, account_id, name, wins, points, heard, placed_ok, variant, played_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
    [
      randomBytes(12).toString("hex"),
      account.id,
      account.name,
      Math.max(0, Math.floor(input.wins)),
      Math.max(0, Math.floor(input.points)),
      Math.max(0, Math.floor(input.heard)),
      Math.max(0, Math.floor(input.placedOk)),
      input.variant.slice(0, 24),
    ],
  );
}

const RANGE_SQL: Record<Exclude<BoardRange, "all">, string> = {
  day: `(date_trunc('day', now() AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'Europe/Berlin')`,
  week: `(date_trunc('week', now() AT TIME ZONE 'Europe/Berlin') AT TIME ZONE 'Europe/Berlin')`,
};

function hitOf(placed: number, heard: number) {
  if (heard <= 0) return 0;
  return Math.round((100 * placed) / heard);
}

function mapBoard(row: {
  account_id: string;
  name: string;
  games: string | number;
  wins: string | number;
  points: string | number;
  heard: string | number;
  placed_ok: string | number;
  rank: string | number;
}): BoardRow {
  const heard = Number(row.heard) || 0;
  const placedOk = Number(row.placed_ok) || 0;
  return {
    accountId: row.account_id,
    name: row.name,
    games: Number(row.games) || 0,
    wins: Number(row.wins) || 0,
    points: Number(row.points) || 0,
    heard,
    placedOk,
    hit: hitOf(placedOk, heard),
    rank: Number(row.rank) || 0,
  };
}

async function boardQuery(range: BoardRange, limit: number) {
  await ensureAccountTables();
  const sql = await getSql();
  const where = range === "all" ? "" : `WHERE played_at >= ${RANGE_SQL[range]}`;
  const rows = await sql.query<{
    account_id: string;
    name: string;
    games: string | number;
    wins: string | number;
    points: string | number;
    heard: string | number;
    placed_ok: string | number;
    rank: string | number;
  }>(
    `SELECT account_id, name, games, wins, points, heard, placed_ok,
            RANK() OVER (ORDER BY wins DESC, points DESC, heard DESC)::int AS rank
     FROM (
       SELECT account_id, name,
              COUNT(*)::int AS games,
              SUM(wins)::int AS wins,
              SUM(points)::int AS points,
              SUM(heard)::int AS heard,
              SUM(placed_ok)::int AS placed_ok
       FROM jahrgang_board
       ${where}
       GROUP BY account_id, name
     ) grouped
     ORDER BY rank ASC, name ASC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapBoard);
}

async function rankOf(accountId: string, range: BoardRange) {
  await ensureAccountTables();
  const sql = await getSql();
  const where = range === "all" ? "" : `WHERE played_at >= ${RANGE_SQL[range]}`;
  const rows = await sql.query<{ rank: string | number }>(
    `SELECT rank FROM (
       SELECT account_id,
              RANK() OVER (ORDER BY wins DESC, points DESC, heard DESC)::int AS rank
       FROM (
         SELECT account_id,
                SUM(wins)::int AS wins,
                SUM(points)::int AS points,
                SUM(heard)::int AS heard
         FROM jahrgang_board
         ${where}
         GROUP BY account_id
       ) grouped
     ) ranked
     WHERE account_id = $1
     LIMIT 1`,
    [accountId],
  );
  const rank = Number(rows[0]?.rank);
  return rank > 0 ? rank : null;
}

export async function listBoard(range: BoardRange = "all", limit = 25) {
  return boardQuery(range, limit);
}

export async function listBoards(limit = 20) {
  const [day, week, all] = await Promise.all([
    boardQuery("day", limit),
    boardQuery("week", limit),
    boardQuery("all", limit),
  ]);
  return { day, week, all };
}

export async function accountStats(accountId: string): Promise<AccountStats> {
  await ensureAccountTables();
  const sql = await getSql();
  const rows = await sql.query<{
    games: string | number;
    wins: string | number;
    points: string | number;
    heard: string | number;
    placed_ok: string | number;
  }>(
    `SELECT COUNT(*)::int AS games,
            COALESCE(SUM(wins),0)::int AS wins,
            COALESCE(SUM(points),0)::int AS points,
            COALESCE(SUM(heard),0)::int AS heard,
            COALESCE(SUM(placed_ok),0)::int AS placed_ok
     FROM jahrgang_board
     WHERE account_id = $1`,
    [accountId],
  );
  const row = rows[0];
  const heard = Number(row?.heard) || 0;
  const placedOk = Number(row?.placed_ok) || 0;
  const [day, week, all] = await Promise.all([
    rankOf(accountId, "day"),
    rankOf(accountId, "week"),
    rankOf(accountId, "all"),
  ]);
  return {
    games: Number(row?.games) || 0,
    wins: Number(row?.wins) || 0,
    points: Number(row?.points) || 0,
    heard,
    placedOk,
    hit: hitOf(placedOk, heard),
    rank: { day, week, all },
  };
}
