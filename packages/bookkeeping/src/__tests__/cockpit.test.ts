import { describe, it, expect, beforeEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../db/migrations.js";
import { clientRegisterTool } from "../tools/client_register.js";
import { clientSummaryTool } from "../tools/client_summary.js";
import { monthEndStatusTool } from "../tools/month_end_status.js";
import { monthendNarrativePrompt } from "../prompts/monthend_narrative.js";
import { MONTH_END_CHECKLIST, findChecklistItem } from "../cockpit/checklist.js";

function unwrap(result: { content: Array<{ type: string; text: string }> }): unknown {
  return JSON.parse(result.content[0]!.text);
}

let dbPath: string;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "chadlabs-cockpit-"));
  dbPath = join(dir, "test.sqlite");
  process.env["CHADLABS_BOOKKEEPING_DB"] = dbPath;
  // The tools use the getDb singleton which reads env on first call per test.
  // We reset the singleton by invalidating Node's module cache for connection.
  // Simpler: open + migrate the DB ourselves so subsequent tool calls find it.
  const db = openDb(dbPath);
  migrate(db, migrations);
  db.close();

  // Force connection module to re-resolve the env var by clearing its cached db.
  const conn = await import("../db/connection.js");
  conn._resetDb();
});

describe("clientRegisterTool", () => {
  it("creates a new client when slug is unseen", async () => {
    const result = await clientRegisterTool.handler({
      display_name: "Acme Inc",
    });
    const data = unwrap(result) as { action: string; normalized_slug: string; id: string };
    expect(data.action).toBe("created");
    expect(data.normalized_slug).toBe("acme-inc");
    expect(data.id.length).toBeGreaterThan(10);
  });

  it("upserts when called twice with the same display name", async () => {
    await clientRegisterTool.handler({ display_name: "Acme Inc" });
    const second = await clientRegisterTool.handler({
      display_name: "Acme Inc",
      notes: "added a note",
    });
    const data = unwrap(second) as { action: string };
    expect(data.action).toBe("updated");
  });

  it("derives slug from display_name when slug not provided", async () => {
    const result = await clientRegisterTool.handler({
      display_name: "ChadLabs LLC",
    });
    const data = unwrap(result) as { normalized_slug: string };
    expect(data.normalized_slug).toBe("chadlabs-llc");
  });
});

describe("clientSummaryTool", () => {
  it("returns empty roster when no clients exist", async () => {
    const result = await clientSummaryTool.handler({});
    const data = unwrap(result) as { client_count: number; clients: unknown[] };
    expect(data.client_count).toBe(0);
    expect(data.clients).toEqual([]);
  });

  it("lists registered active clients in display_name order", async () => {
    await clientRegisterTool.handler({ display_name: "Zebra Co" });
    await clientRegisterTool.handler({ display_name: "Acme Inc" });
    const result = await clientSummaryTool.handler({});
    const data = unwrap(result) as { clients: Array<{ display_name: string }> };
    expect(data.clients.map((c) => c.display_name)).toEqual(["Acme Inc", "Zebra Co"]);
  });

  it("exposes globals (vendor + chase counts)", async () => {
    const result = await clientSummaryTool.handler({});
    const data = unwrap(result) as { globals: { known_vendors: number; open_chases: number } };
    expect(typeof data.globals.known_vendors).toBe("number");
    expect(typeof data.globals.open_chases).toBe("number");
  });
});

describe("monthEndStatusTool", () => {
  beforeEach(async () => {
    await clientRegisterTool.handler({ display_name: "Acme Inc" });
  });

  it("returns the full canonical checklist with all items unchecked initially", async () => {
    const result = await monthEndStatusTool.handler({
      client_slug: "acme-inc",
      period: "2026-05",
    });
    const data = unwrap(result) as {
      total: number;
      completed: number;
      checklist: Array<{ item_key: string; checked: boolean }>;
      next_item: string | null;
    };
    expect(data.total).toBe(MONTH_END_CHECKLIST.length);
    expect(data.completed).toBe(0);
    expect(data.checklist.every((c) => c.checked === false)).toBe(true);
    expect(data.next_item).toBe("bank_recon");
  });

  it("toggles an item and reports the updated count", async () => {
    const result = await monthEndStatusTool.handler({
      client_slug: "acme-inc",
      period: "2026-05",
      set: { item_key: "bank_recon", checked: true },
    });
    const data = unwrap(result) as { completed: number; next_item: string | null };
    expect(data.completed).toBe(1);
    expect(data.next_item).toBe("cc_recon");
  });

  it("rejects unknown client_slug", async () => {
    await expect(
      monthEndStatusTool.handler({
        client_slug: "does-not-exist",
        period: "2026-05",
      })
    ).rejects.toThrow(/unknown client_slug/);
  });

  it("rejects malformed period via zod schema", () => {
    const parsed = monthEndStatusTool.inputSchema.safeParse({
      client_slug: "acme-inc",
      period: "2026-5", // wrong format
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown item_key on set", async () => {
    await expect(
      monthEndStatusTool.handler({
        client_slug: "acme-inc",
        period: "2026-05",
        set: { item_key: "does_not_exist", checked: true },
      })
    ).rejects.toThrow(/unknown item_key/);
  });
});

describe("MONTH_END_CHECKLIST", () => {
  it("has 15 items", () => {
    expect(MONTH_END_CHECKLIST.length).toBe(15);
  });

  it("has unique item_keys", () => {
    const keys = new Set(MONTH_END_CHECKLIST.map((c) => c.key));
    expect(keys.size).toBe(MONTH_END_CHECKLIST.length);
  });

  it("findChecklistItem returns the right item or undefined", () => {
    expect(findChecklistItem("bank_recon")?.label).toBe("Bank reconciliation");
    expect(findChecklistItem("does_not_exist")).toBeUndefined();
  });
});

describe("monthendNarrativePrompt", () => {
  it("requires client_json and pl_summary_json", () => {
    const required = (monthendNarrativePrompt.arguments ?? []).filter(
      (a) => a.required !== false
    );
    const names = required.map((a) => a.name);
    expect(names).toContain("client_json");
    expect(names).toContain("pl_summary_json");
  });

  it("renders system + user messages with the inputs embedded", () => {
    const out = monthendNarrativePrompt.render({
      client_json: JSON.stringify({ display_name: "Acme Inc", period: "2026-05" }),
      pl_summary_json: JSON.stringify({ revenue: 100000, operating_expenses: 70000, net_income: 30000, currency: "USD" }),
    });
    expect(out.messages).toHaveLength(2);
    const user = out.messages[1]!.content.text;
    expect(user).toContain("Acme Inc");
    expect(user).toContain("100000");
  });

  it("includes prior-period and follow-ups when provided", () => {
    const out = monthendNarrativePrompt.render({
      client_json: "{}",
      pl_summary_json: "{}",
      prior_period_pl_summary_json: JSON.stringify({ revenue: 90000 }),
      open_followups_json: JSON.stringify([{ kind: "missing_receipt", id: "t1" }]),
    });
    const user = out.messages[1]!.content.text;
    expect(user).toContain("prior period");
    expect(user).toContain("Open follow-ups");
  });

  it("respects tone selection", () => {
    const exec = monthendNarrativePrompt.render({
      client_json: "{}",
      pl_summary_json: "{}",
      tone: "executive",
    });
    expect(exec.messages[0]!.content.text).toContain("Executive-summary");
    const warm = monthendNarrativePrompt.render({
      client_json: "{}",
      pl_summary_json: "{}",
      tone: "warm",
    });
    expect(warm.messages[0]!.content.text).toContain("Warm and personable");
  });
});
