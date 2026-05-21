import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@chadlabs/core";
import { migrations } from "../db/migrations.js";

describe("db migrations", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("applies all migrations without error", () => {
    expect(() => migrate(db, migrations)).not.toThrow();
  });

  it("creates the transactions table", () => {
    migrate(db, migrations);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe("transactions");
  });

  it("creates the vendors table", () => {
    migrate(db, migrations);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vendors'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe("vendors");
  });

  it("creates the categories table", () => {
    migrate(db, migrations);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe("categories");
  });

  it("creates the chase_log table", () => {
    migrate(db, migrations);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chase_log'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe("chase_log");
  });

  it("seeds ~30 categories", () => {
    migrate(db, migrations);
    const rows = db.prepare("SELECT COUNT(*) as count FROM categories").get() as {
      count: number;
    };
    expect(rows.count).toBeGreaterThanOrEqual(25);
    expect(rows.count).toBeLessThanOrEqual(40);
  });

  it("is idempotent — running migrations twice does not error", () => {
    migrate(db, migrations);
    expect(() => migrate(db, migrations)).not.toThrow();
  });

  it("records applied migrations in _migrations table", () => {
    migrate(db, migrations);
    const rows = db.prepare("SELECT version FROM _migrations ORDER BY version").all() as Array<{
      version: number;
    }>;
    const versions = rows.map((r) => r.version);
    expect(versions).toContain(1);
    expect(versions).toContain(2);
    expect(versions).toContain(3);
    expect(versions).toContain(4);
    expect(versions).toContain(5);
  });

  it("transactions table has expected columns", () => {
    migrate(db, migrations);
    const cols = db
      .prepare("PRAGMA table_info(transactions)")
      .all() as Array<{ name: string }>;
    const colNames = cols.map((c) => c.name);
    for (const expected of [
      "id", "date", "amount", "currency", "description",
      "account", "category", "confidence", "status",
      "raw_payload_json", "classified_at", "created_at",
    ]) {
      expect(colNames).toContain(expected);
    }
  });
});
