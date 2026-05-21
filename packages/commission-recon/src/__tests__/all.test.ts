import { describe, it, expect, beforeEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../db/migrations.js";
import { tools, prompts, resources } from "../server.js";
import { CARRIER_FORMATS, CARRIER_FORMATS_MARKDOWN, carrierFormatsResource } from "../resources/carrier-formats.js";
import { discrepancyLogRecordTool } from "../tools/discrepancy_log_record.js";
import { disputeEmailDraftPrompt } from "../prompts/dispute_email_draft.js";

function unwrap(r: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(r.content[0]!.text);
}

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "chadlabs-cr-"));
  const dbPath = join(dir, "test.sqlite");
  process.env["CHADLABS_COMMISSIONRECON_DB"] = dbPath;
  const db = openDb(dbPath);
  migrate(db, migrations);
  db.close();
  const conn = await import("../db/connection.js");
  conn._resetDb();
});

describe("server export shape", () => {
  it("exports 1 tool + 1 prompt + 1 resource", () => {
    expect(tools.map((t) => t.name)).toEqual(["discrepancy_log_record"]);
    expect(prompts.map((p) => p.name)).toEqual(["dispute_email_draft"]);
    expect(resources).toHaveLength(1);
    expect(resources[0]!.uri).toBe("commission-recon://carrier-formats");
  });
});

describe("carrier-formats resource", () => {
  it("ships 10 carriers, no duplicate codes", () => {
    expect(CARRIER_FORMATS.length).toBe(10);
    const codes = new Set(CARRIER_FORMATS.map((c) => c.carrier_code));
    expect(codes.size).toBe(10);
  });

  it("covers both health and p_and_c kinds", () => {
    const kinds = new Set(CARRIER_FORMATS.map((c) => c.kind));
    expect(kinds.has("health")).toBe(true);
    expect(kinds.has("p_and_c")).toBe(true);
  });

  it("markdown contains every carrier_code", () => {
    for (const c of CARRIER_FORMATS) {
      expect(CARRIER_FORMATS_MARKDOWN).toContain(c.carrier_code);
    }
  });

  it("resource.read() returns the markdown", async () => {
    expect(await carrierFormatsResource.read()).toBe(CARRIER_FORMATS_MARKDOWN);
  });
});

describe("discrepancy_log_record", () => {
  it("inserts an underpayment row and returns the delta", async () => {
    const r = await discrepancyLogRecordTool.handler({
      policy_number: "POL-TEST-001",
      carrier: "aetna",
      statement_period: "2026-05",
      expected_commission: 150,
      actual_commission: 100,
    });
    const data = unwrap(r) as { delta: number; delta_kind: string; status: string };
    expect(data.delta).toBe(-50);
    expect(data.delta_kind).toBe("underpaid");
    expect(data.status).toBe("underpaid");
  });

  it("flags overpayments correctly", async () => {
    const r = await discrepancyLogRecordTool.handler({
      policy_number: "POL-TEST-002",
      carrier: "cigna",
      statement_period: "2026-05",
      expected_commission: 100,
      actual_commission: 150,
      status: "overpaid",
    });
    const data = unwrap(r) as { delta: number; delta_kind: string; status: string };
    expect(data.delta).toBe(50);
    expect(data.delta_kind).toBe("overpaid");
    expect(data.status).toBe("overpaid");
  });

  it("rejects invalid status via zod", () => {
    const parsed = discrepancyLogRecordTool.inputSchema.safeParse({
      policy_number: "x",
      carrier: "y",
      statement_period: "z",
      expected_commission: 1,
      actual_commission: 1,
      status: "made_up",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("dispute_email_draft prompt", () => {
  it("requires discrepancy_json", () => {
    const required = (disputeEmailDraftPrompt.arguments ?? []).filter((a) => a.required !== false);
    expect(required.map((a) => a.name)).toEqual(["discrepancy_json"]);
  });

  it("renders system + user; friendly tone by default", () => {
    const out = disputeEmailDraftPrompt.render({
      discrepancy_json: JSON.stringify({ policy_number: "POL-1", expected_commission: 100, actual_commission: 80 }),
    });
    expect(out.messages).toHaveLength(2);
    expect(out.messages[0]!.content.text).toContain("Friendly");
  });

  it("respects firm tone", () => {
    const out = disputeEmailDraftPrompt.render({
      discrepancy_json: "{}",
      tone: "firm",
    });
    expect(out.messages[0]!.content.text).toContain("Firm and direct");
  });

  it("includes prior history when provided", () => {
    const out = disputeEmailDraftPrompt.render({
      discrepancy_json: "{}",
      policy_history_json: JSON.stringify([{ resolved_at: "2026-03-01" }]),
    });
    expect(out.messages[1]!.content.text).toContain("Prior history");
  });
});

describe("migrations", () => {
  it("schema version reaches 3 after applying all migrations", () => {
    const dir = mkdtempSync(join(tmpdir(), "chadlabs-cr-mig-"));
    const db = openDb(join(dir, "mig.sqlite"));
    const r = migrate(db, migrations);
    expect(r.applied).toEqual([1, 2, 3]);
    const v = (db.prepare("SELECT MAX(version) as v FROM _migrations").get() as { v: number }).v;
    expect(v).toBe(3);
    const carriers = (db.prepare("SELECT COUNT(*) as c FROM carriers").get() as { c: number }).c;
    expect(carriers).toBe(10);
    db.close();
  });

  it("re-applying migrations is a no-op", () => {
    const dir = mkdtempSync(join(tmpdir(), "chadlabs-cr-mig2-"));
    const db = openDb(join(dir, "mig.sqlite"));
    migrate(db, migrations);
    const second = migrate(db, migrations);
    expect(second.applied).toEqual([]);
    db.close();
  });
});
