import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "./migrations.js";

let _db: Database.Database | null = null;

export function defaultDbPath(): string {
  return (
    process.env["CHADLABS_PRIORAUTH_DB"] ??
    `${homedir()}/.chadlabs/prior-auth/db.sqlite`
  );
}

export function getDb(): Database.Database {
  if (_db) return _db;
  const path = defaultDbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = openDb(path);
  migrate(db, migrations);
  _db = db;
  return _db;
}

/** Test-only: inject an in-memory DB and run migrations against it. */
export function _setDbForTesting(db: Database.Database): void {
  migrate(db, migrations);
  _db = db;
}

/** Test-only: reset for next test. */
export function _resetDb(): void {
  if (_db) _db.close();
  _db = null;
}
