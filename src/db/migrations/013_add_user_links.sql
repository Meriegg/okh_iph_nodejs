CREATE TABLE IF NOT EXISTS user_links (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  
  name TEXT NOT NULL,
  link TEXT NOT NULL,
  type TEXT NOT NULL,

  country TEXT NOT NULL,
  language TEXT NOT NULL,

  quality TEXT,
  bitrate TEXT,
  MISR TEXT,
  adsNumber INTEGER,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);