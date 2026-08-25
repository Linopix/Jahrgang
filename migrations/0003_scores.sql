CREATE TABLE IF NOT EXISTS jahrgang_scores (
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
);

CREATE INDEX IF NOT EXISTS jahrgang_scores_board
  ON jahrgang_scores (wins DESC, points DESC, played_at DESC);
