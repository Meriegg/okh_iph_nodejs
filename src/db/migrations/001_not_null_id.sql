CREATE TABLE users_new (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,

  permission_linkSubmission BOOLEAN DEFAULT FALSE,
  permission_embedSubmission BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_new SELECT * FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;