import type { Migration } from "@chadlabs/core";

export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_commission_rows",
    sql: `
      CREATE TABLE IF NOT EXISTS commission_rows (
        id                  TEXT PRIMARY KEY,
        carrier             TEXT NOT NULL,
        statement_period    TEXT NOT NULL,
        policy_number       TEXT NOT NULL,
        member_or_account   TEXT,
        premium             REAL,
        commission_amount   REAL NOT NULL,
        commission_rate     REAL,
        transaction_type    TEXT NOT NULL DEFAULT 'unknown'
                            CHECK (transaction_type IN ('new','renewal','endorsement','unknown')),
        raw_fingerprint     TEXT NOT NULL UNIQUE,
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    name: "create_discrepancy_log",
    sql: `
      CREATE TABLE IF NOT EXISTS discrepancy_log (
        id                  TEXT PRIMARY KEY,
        policy_number       TEXT NOT NULL,
        carrier             TEXT NOT NULL,
        statement_period    TEXT NOT NULL,
        expected_commission REAL NOT NULL,
        actual_commission   REAL NOT NULL,
        status              TEXT NOT NULL DEFAULT 'underpaid'
                            CHECK (status IN ('underpaid','overpaid','missing','disputed','resolved')),
        notes               TEXT,
        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 3,
    name: "create_carriers",
    sql: `
      CREATE TABLE IF NOT EXISTS carriers (
        code   TEXT PRIMARY KEY,
        name   TEXT NOT NULL,
        kind   TEXT NOT NULL CHECK (kind IN ('health','p_and_c','life'))
      );
      INSERT OR IGNORE INTO carriers (code, name, kind) VALUES
        ('united_healthcare', 'UnitedHealthcare',         'health'),
        ('aetna',             'Aetna',                    'health'),
        ('cigna',             'Cigna',                    'health'),
        ('anthem',            'Anthem BCBS',              'health'),
        ('humana',            'Humana',                   'health'),
        ('travelers',         'Travelers',                'p_and_c'),
        ('progressive',       'Progressive',              'p_and_c'),
        ('liberty_mutual',    'Liberty Mutual',           'p_and_c'),
        ('allstate',          'Allstate',                 'p_and_c'),
        ('state_farm',        'State Farm',               'p_and_c');
    `,
  },
];
