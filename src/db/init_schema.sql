CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,

  permission_linkSubmission BOOLEAN DEFAULT FALSE,
  permission_embedSubmission BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);