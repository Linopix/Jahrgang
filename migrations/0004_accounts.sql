CREATE TABLE IF NOT EXISTS jahrgang_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jahrgang_board (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  heard INTEGER NOT NULL DEFAULT 0,
  placed_ok INTEGER NOT NULL DEFAULT 0,
  variant TEXT NOT NULL DEFAULT 'timeline',
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jahrgang_board_rank
  ON jahrgang_board (wins DESC, points DESC, played_at DESC);

CREATE INDEX IF NOT EXISTS jahrgang_board_played
  ON jahrgang_board (played_at DESC);

CREATE INDEX IF NOT EXISTS jahrgang_board_account
  ON jahrgang_board (account_id);
