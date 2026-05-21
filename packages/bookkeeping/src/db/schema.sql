-- Bookkeeping MCP — schema
-- _migrations table is owned by core/migrate(); do not create it here.

CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  date           TEXT NOT NULL,           -- ISO 8601 date string
  amount         REAL NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USD',
  description    TEXT NOT NULL,
  account        TEXT,
  category       TEXT,
  confidence     REAL,                    -- 0-1, set by classifier
  status         TEXT NOT NULL DEFAULT 'uncategorized',
  raw_payload_json TEXT,
  classified_at  TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  normalized_name  TEXT NOT NULL UNIQUE,
  default_category TEXT,
  notes            TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  name        TEXT PRIMARY KEY,
  parent      TEXT REFERENCES categories(name),
  description TEXT
);

CREATE TABLE IF NOT EXISTS chase_log (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT REFERENCES transactions(id),
  client_email    TEXT NOT NULL,
  draft_subject   TEXT NOT NULL,
  draft_body      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | resolved
  sent_at         TEXT,
  resolved_at     TEXT
);
