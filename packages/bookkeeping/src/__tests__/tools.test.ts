import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { vendorLookupTool, lookupVendors } from "../tools/vendor_lookup.js";
import {
  vendorRememberTool,
  VendorRememberInputSchema,
} from "../tools/vendor_remember.js";
import {
  chaseLogRecordTool,
  ChaseLogRecordInputSchema,
} from "../tools/chase_log_record.js";
import { _setDbForTesting, _resetDb } from "../db/connection.js";

function unwrap<T>(envelope: { content: Array<{ type: string; text: string }> }): T {
  const text = envelope.content[0]?.text ?? "";
  return JSON.parse(text) as T;
}

let db: Database.Database;

beforeEach(() => {
  db = new Database(":memory:");
  _setDbForTesting(db);
});

afterEach(() => {
  _resetDb();
});

describe("vendor_remember tool", () => {
  it("inserts a new vendor", async () => {
    const result = await vendorRememberTool.handler({
      name: "OpenAI",
      normalized_name: "openai",
      default_category: "Software & SaaS",
    });
    const data = unwrap<{ action: string; normalized_name: string }>(result);
    expect(data.action).toBe("inserted");
    expect(data.normalized_name).toBe("openai");

    const row = db.prepare(`SELECT * FROM vendors WHERE normalized_name = 'openai'`).get();
    expect(row).toBeTruthy();
  });

  it("updates an existing vendor on second call", async () => {
    await vendorRememberTool.handler({
      name: "OpenAI",
      normalized_name: "openai",
      default_category: "Software & SaaS",
    });
    const second = await vendorRememberTool.handler({
      name: "OpenAI Inc.",
      normalized_name: "openai",
      default_category: "Technology",
    });
    const data = unwrap<{ action: string }>(second);
    expect(data.action).toBe("updated");

    const row = db
      .prepare(`SELECT name, default_category FROM vendors WHERE normalized_name = 'openai'`)
      .get() as { name: string; default_category: string };
    expect(row.name).toBe("OpenAI Inc.");
    expect(row.default_category).toBe("Technology");
  });

  it("schema rejects empty name", () => {
    const result = VendorRememberInputSchema.safeParse({
      name: "",
      normalized_name: "x",
      default_category: "Other",
    });
    expect(result.success).toBe(false);
  });
});

describe("vendor_lookup tool", () => {
  beforeEach(async () => {
    await vendorRememberTool.handler({
      name: "OpenAI",
      normalized_name: "openai",
      default_category: "Software & SaaS",
    });
    await vendorRememberTool.handler({
      name: "Amazon Web Services",
      normalized_name: "amazon web services",
      default_category: "Cloud Hosting",
    });
    await vendorRememberTool.handler({
      name: "Uber",
      normalized_name: "uber",
      default_category: "Travel",
    });
  });

  it("exact match returns match_kind exact", async () => {
    const result = await vendorLookupTool.handler({ name: "OpenAI" });
    const data = unwrap<{ matches: Array<{ match_kind: string; default_category: string }> }>(result);
    expect(data.matches[0]?.match_kind).toBe("exact");
    expect(data.matches[0]?.default_category).toBe("Software & SaaS");
  });

  it("fuzzy matches with score >= 0.85", () => {
    const matches = lookupVendors(db, "amazon web services", 5);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]!.match_score).toBeGreaterThanOrEqual(0.85);
  });

  it("returns empty matches for unrelated string", async () => {
    const result = await vendorLookupTool.handler({ name: "completely unrelated zzz" });
    const data = unwrap<{ matches: unknown[] }>(result);
    expect(data.matches).toHaveLength(0);
  });

  it("respects limit", async () => {
    const result = await vendorLookupTool.handler({ name: "uber", limit: 1 });
    const data = unwrap<{ matches: unknown[] }>(result);
    expect(data.matches.length).toBeLessThanOrEqual(1);
  });
});

describe("chase_log_record tool", () => {
  it("records one row per transaction", async () => {
    const result = await chaseLogRecordTool.handler({
      client_email: "sarah@example.com",
      transaction_ids: ["t1", "t2", "t3"],
      draft_subject: "Quick request",
      draft_body: "Please send the receipts for the listed items.",
    });
    const data = unwrap<{ transaction_count: number; status: string }>(result);
    expect(data.transaction_count).toBe(3);
    expect(data.status).toBe("draft");

    const rows = db.prepare(`SELECT * FROM chase_log`).all();
    expect(rows).toHaveLength(3);
  });

  it("status sent records sent_at timestamp", async () => {
    await chaseLogRecordTool.handler({
      client_email: "sarah@example.com",
      transaction_ids: ["t1"],
      draft_subject: "x",
      draft_body: "y",
      status: "sent",
    });
    const row = db.prepare(`SELECT sent_at, resolved_at FROM chase_log`).get() as {
      sent_at: string | null;
      resolved_at: string | null;
    };
    expect(row.sent_at).toBeTruthy();
    expect(row.resolved_at).toBeNull();
  });

  it("schema rejects invalid email", () => {
    const result = ChaseLogRecordInputSchema.safeParse({
      client_email: "not-an-email",
      transaction_ids: ["t1"],
      draft_subject: "x",
      draft_body: "y",
    });
    expect(result.success).toBe(false);
  });

  it("schema rejects empty transaction_ids", () => {
    const result = ChaseLogRecordInputSchema.safeParse({
      client_email: "x@y.com",
      transaction_ids: [],
      draft_subject: "x",
      draft_body: "y",
    });
    expect(result.success).toBe(false);
  });
});
