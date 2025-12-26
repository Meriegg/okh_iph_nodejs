CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY NOT NULL,

  league TEXT NOT NULL,
  league_image TEXT NOT NULL,
  league_country TEXT,

  sport TEXT NOT NULL,

  team1 TEXT NOT NULL,
  team1_image TEXT NOT NULL,

  team2 TEXT NOT NULL,
  team2_image TEXT NOT NULL,

  timestamp INTEGER NOT NULL,
  duration INTEGER NOT NULL,

  external_id TEXT
);