CREATE TABLE IF NOT EXISTS livetv_channles (
  id TEXT PRIMARY KEY NOT NULL,
  channel_name TEXT NOT NULL,
  language TEXT NOT NULL,
  links_json TEXT NOT NULL,
  channel_image TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);