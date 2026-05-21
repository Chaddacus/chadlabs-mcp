import { describe, it, expect } from "vitest";
import { openDb, migrate } from "../db.js";
import type { Migration } from "../db.js";

const m1: Migration = {
  version: 1,
  name: "create_users",
  sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
};

const m2: Migration = {
  version: 2,
  name: "create_posts",
  sql: "CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT NOT NULL)",
};

describe("migrate", () => {
  it("applies migrations and records them", () => {
    const db = openDb(":memory:");
    const result = migrate(db, [m1]);
    expect(result.applied).toEqual([1]);
    expect(result.skipped).toEqual([]);

    const row = db.prepare("SELECT version, name FROM _migrations WHERE version = 1").get() as
      | { version: number; name: string }
      | undefined;
    expect(row?.version).toBe(1);
    expect(row?.name).toBe("create_users");
  });

  it("second run with same migration is a no-op", () => {
    const db = openDb(":memory:");
    migrate(db, [m1]);
    const result2 = migrate(db, [m1]);
    expect(result2.applied).toEqual([]);
    expect(result2.skipped).toEqual([1]);
  });

  it("applies out-of-order versions in version-number order", () => {
    const db = openDb(":memory:");
    const result = migrate(db, [m2, m1]);
    expect(result.applied).toEqual([1, 2]);
    expect(result.skipped).toEqual([]);
  });

  it("subsequent run with new migration only applies the new one", () => {
    const db = openDb(":memory:");
    migrate(db, [m1]);
    const result2 = migrate(db, [m1, m2]);
    expect(result2.applied).toEqual([2]);
    expect(result2.skipped).toEqual([1]);
  });
});
