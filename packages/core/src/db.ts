import Database from "better-sqlite3";

export { Database };

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export function openDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  return db;
}

export function migrate(
  db: Database.Database,
  migrations: Migration[]
): { applied: number[]; skipped: number[] } {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const applied: number[] = [];
  const skipped: number[] = [];

  const sorted = [...migrations].sort((a, b) => a.version - b.version);

  const isApplied = db.prepare<[number], { version: number }>(
    "SELECT version FROM _migrations WHERE version = ?"
  );
  const record = db.prepare(
    "INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)"
  );

  for (const m of sorted) {
    if (isApplied.get(m.version)) {
      skipped.push(m.version);
      continue;
    }
    db.exec(m.sql);
    record.run(m.version, m.name, new Date().toISOString());
    applied.push(m.version);
  }

  return { applied, skipped };
}
