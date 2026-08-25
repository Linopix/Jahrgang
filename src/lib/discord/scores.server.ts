import { randomBytes } from "node:crypto";
import { getSql } from "@/lib/db";
import { ensureScoresTable, type DiscordProfile } from "./oauth.server";

export type ScoreInput = {
  wins: number;
  points: number;
  heard: number;
  placedOk: number;
  variant: string;
};

export type BoardRow = {
  discordId: string;
  name: string;
  avatar: string | null;
  wins: number;
  points: number;
  heard: number;
};

const lastWrite = new Map<string, number>();

export async function saveScore(profile: DiscordProfile, input: ScoreInput) {
  await ensureScoresTable();
  const now = Date.now();
  const prev = lastWrite.get(profile.id) ?? 0;
  if (now - prev < 8000) return;
  lastWrite.set(profile.id, now);
  const sql = await getSql();
  const id = randomBytes(12).toString("hex");
  await sql.query(
    `INSERT INTO jahrgang_scores
      (id, discord_id, name, avatar, wins, points, heard, placed_ok, variant, played_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())`,
    [
      id,
      profile.id,
      profile.username.slice(0, 24),
      profile.avatar,
      Math.max(0, Math.floor(input.wins)),
      Math.max(0, Math.floor(input.points)),
      Math.max(0, Math.floor(input.heard)),
      Math.max(0, Math.floor(input.placedOk)),
      input.variant.slice(0, 24),
    ],
  );
}

export async function listBoard(limit = 20): Promise<BoardRow[]> {
  await ensureScoresTable();
  const sql = await getSql();
  const rows = await sql.query<{
    discord_id: string;
    name: string;
    avatar: string | null;
    wins: string | number;
    points: string | number;
    heard: string | number;
  }>(
    `SELECT discord_id, name, avatar,
            SUM(wins)::int AS wins,
            SUM(points)::int AS points,
            SUM(heard)::int AS heard
     FROM jahrgang_scores
     GROUP BY discord_id, name, avatar
     ORDER BY SUM(wins) DESC, SUM(points) DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    discordId: row.discord_id,
    name: row.name,
    avatar: row.avatar,
    wins: Number(row.wins) || 0,
    points: Number(row.points) || 0,
    heard: Number(row.heard) || 0,
  }));
}
