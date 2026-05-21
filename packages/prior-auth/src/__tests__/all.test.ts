import { describe, it, expect, beforeEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../db/migrations.js";
import { tools, prompts, resources } from "../server.js";
import { REASON_CODES, REASON_CODES_MARKDOWN, reasonCodesResource } from "../resources/reason-codes.js";
import { slaClockCheckTool } from "../tools/sla_clock_check.js";
import { appealLogRecordTool } from "../tools/appeal_log_record.js";
import { appealLetterDraftPrompt } from "../prompts/appeal_letter_draft.js";
import { denialClassifyPrompt } from "../prompts/denial_classify.js";

function unwrap(r: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(r.content[0]!.text);
}

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "chadlabs-pa-"));
  const dbPath = join(dir, "test.sqlite");
  process.env["CHADLABS_PRIORAUTH_DB"] = dbPath;
  const db = openDb(dbPath);
  migrate(db, migrations);
  db.close();
  const conn = await import("../db/connection.js");
  conn._resetDb();
});

describe("server export shape", () => {
  it("exports 3 tools + 2 prompts + 1 resource", () => {
    expect(tools.map((t) => t.name).sort()).toEqual([
      "appeal_log_record",
      "denial_reason_extract",
      "sla_clock_check",
    ]);
    expect(prompts.map((p) => p.name).sort()).toEqual(["appeal_letter_draft", "denial_classify"]);
    expect(resources).toHaveLength(1);
    expect(resources[0]!.uri).toBe("prior-auth://reason-codes");
  });
});

describe("reason codes resource", () => {
  it("has at least 20 distinct codes", () => {
    expect(REASON_CODES.length).toBeGreaterThanOrEqual(20);
    const uniq = new Set(REASON_CODES.map((r) => r.code));
    expect(uniq.size).toBe(REASON_CODES.length);
  });

  it("markdown contains every code", () => {
    for (const r of REASON_CODES) {
      expect(REASON_CODES_MARKDOWN).toContain(r.code);
    }
  });

  it("resource.read() returns the markdown", async () => {
    const text = await reasonCodesResource.read();
    expect(text).toBe(REASON_CODES_MARKDOWN);
  });
});

describe("sla_clock_check", () => {
  it("returns 'fresh' for a denial received seconds ago on a 7-day SLA", async () => {
    const r = await slaClockCheckTool.handler({
      denial_received_at: new Date().toISOString(),
      sla_kind: "standard_7day",
    });
    const data = unwrap(r) as { status: string; hours_remaining: number };
    expect(data.status).toBe("fresh");
    // 7 days = 168h; we lose milliseconds in the round-trip so be generous.
    expect(data.hours_remaining).toBeGreaterThan(167);
    expect(data.hours_remaining).toBeLessThanOrEqual(168);
  });

  it("returns 'warning' for a denial received 5 days ago on a 7-day SLA", async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const r = await slaClockCheckTool.handler({
      denial_received_at: fiveDaysAgo,
      sla_kind: "standard_7day",
    });
    expect((unwrap(r) as { status: string }).status).toBe("warning");
  });

  it("returns 'overdue' for a denial received 10 days ago on a 7-day SLA", async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const r = await slaClockCheckTool.handler({
      denial_received_at: tenDaysAgo,
      sla_kind: "standard_7day",
    });
    const data = unwrap(r) as { status: string; hours_remaining: number };
    expect(data.status).toBe("overdue");
    expect(data.hours_remaining).toBeLessThan(0);
  });

  it("handles expedited_72hour", async () => {
    const r = await slaClockCheckTool.handler({
      denial_received_at: new Date().toISOString(),
      sla_kind: "expedited_72hour",
    });
    const data = unwrap(r) as { hours_remaining: number; status: string };
    expect(data.hours_remaining).toBeGreaterThan(71);
    expect(data.hours_remaining).toBeLessThanOrEqual(72);
    expect(data.status).toBe("fresh");
  });

  it("rejects unknown sla_kind via zod", () => {
    const parsed = slaClockCheckTool.inputSchema.safeParse({
      denial_received_at: new Date().toISOString(),
      sla_kind: "made_up",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("appeal_log_record", () => {
  it("inserts a row and returns the id + claim_id", async () => {
    const r = await appealLogRecordTool.handler({
      claim_id: "CLAIM-TEST-001",
      payer: "aetna",
      denial_reason_code: "MN-001",
      appeal_sent_at: new Date().toISOString(),
      appeal_type: "first_level",
    });
    const data = unwrap(r) as { id: string; claim_id: string; outcome: string };
    expect(data.claim_id).toBe("CLAIM-TEST-001");
    expect(data.outcome).toBe("pending");
    expect(data.id.length).toBeGreaterThan(10);
  });

  it("rejects invalid appeal_type", () => {
    const parsed = appealLogRecordTool.inputSchema.safeParse({
      claim_id: "x",
      payer: "y",
      appeal_sent_at: new Date().toISOString(),
      appeal_type: "made_up",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("appeal_letter_draft prompt", () => {
  it("requires denial_json + clinical_facts_json", () => {
    const required = (appealLetterDraftPrompt.arguments ?? []).filter((a) => a.required !== false);
    expect(required.map((a) => a.name).sort()).toEqual(["clinical_facts_json", "denial_json"]);
  });

  it("renders system + user; clinical tone by default", () => {
    const out = appealLetterDraftPrompt.render({
      denial_json: JSON.stringify({ payer: "aetna", claim_id: "C1" }),
      clinical_facts_json: JSON.stringify({ diagnosis_codes: ["M54.5"] }),
    });
    expect(out.messages).toHaveLength(2);
    expect(out.messages[0]!.content.text).toContain("Clinical professional");
  });

  it("embeds reason_codes_markdown when provided", () => {
    const out = appealLetterDraftPrompt.render({
      denial_json: "{}",
      clinical_facts_json: "{}",
      reason_codes_markdown: "# my codes",
    });
    expect(out.messages[0]!.content.text).toContain("# my codes");
    expect(out.messages[0]!.content.text).toContain("cite at least one of these codes");
  });

  it("respects legal tone", () => {
    const out = appealLetterDraftPrompt.render({
      denial_json: "{}",
      clinical_facts_json: "{}",
      tone: "legal",
    });
    expect(out.messages[0]!.content.text).toContain("Formal legal");
  });
});

describe("denial_classify prompt", () => {
  it("requires denial_text", () => {
    const required = (denialClassifyPrompt.arguments ?? []).filter((a) => a.required !== false);
    expect(required.map((a) => a.name)).toEqual(["denial_text"]);
  });

  it("embeds reason_codes_markdown and constrains output", () => {
    const out = denialClassifyPrompt.render({
      denial_text: "Service is not medically necessary",
      reason_codes_markdown: "# canonical codes",
    });
    expect(out.messages[0]!.content.text).toContain("# canonical codes");
    expect(out.messages[0]!.content.text).toContain("EXACTLY one of these codes");
  });

  it("falls back to resource-load instruction without markdown", () => {
    const out = denialClassifyPrompt.render({ denial_text: "x" });
    expect(out.messages[0]!.content.text).toContain('prior-auth://reason-codes');
  });
});
