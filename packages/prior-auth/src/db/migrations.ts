import type { Migration } from "@chadlabs/core";

export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_denial_extractions",
    sql: `
      CREATE TABLE IF NOT EXISTS denial_extractions (
        id                  TEXT PRIMARY KEY,
        claim_id            TEXT,
        payer               TEXT,
        member_id           TEXT,
        denial_reason_code  TEXT,
        denial_reason_text  TEXT,
        raw_excerpt         TEXT,
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    name: "create_appeal_log",
    sql: `
      CREATE TABLE IF NOT EXISTS appeal_log (
        id                  TEXT PRIMARY KEY,
        claim_id            TEXT NOT NULL,
        payer               TEXT NOT NULL,
        denial_reason_code  TEXT,
        appeal_sent_at      TEXT,
        appeal_type         TEXT NOT NULL CHECK (appeal_type IN ('first_level','second_level','peer_to_peer','external_review')),
        outcome             TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending','overturned','upheld','partial')),
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 3,
    name: "create_payers",
    sql: `
      CREATE TABLE IF NOT EXISTS payers (
        code                        TEXT PRIMARY KEY,
        name                        TEXT NOT NULL,
        default_appeal_window_days  INTEGER NOT NULL DEFAULT 60
      );

      INSERT OR IGNORE INTO payers (code, name, default_appeal_window_days) VALUES
        ('united_healthcare', 'UnitedHealthcare', 60),
        ('aetna',             'Aetna',            60),
        ('cigna',             'Cigna',            60),
        ('humana',            'Humana',           60),
        ('anthem',            'Anthem Blue Cross Blue Shield', 60),
        ('kaiser',            'Kaiser Permanente', 30),
        ('bcbs',              'Blue Cross Blue Shield (Other)', 60),
        ('centene',           'Centene',          60),
        ('molina',            'Molina Healthcare', 60),
        ('wellcare',          'WellCare',         60);
    `,
  },
];
