import { describe, it, expect } from "vitest";
import { tools, prompts, resources } from "../server.js";

describe("bookkeeping MCP server", () => {
  it("exports the v0.2 tool set (3 invoice/vendor + 3 multi-client cockpit)", () => {
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "chase_log_record",
      "client_register",
      "client_summary",
      "month_end_status",
      "vendor_lookup",
      "vendor_remember",
    ]);
  });

  it("exports 4 prompts (host LLM drives extraction/classification/draft/narrative)", () => {
    const names = prompts.map((p) => p.name).sort();
    expect(names).toEqual([
      "chase_draft",
      "invoice_extract",
      "monthend_narrative",
      "txn_classify",
    ]);
  });

  it("exports the categories resource", () => {
    expect(resources).toHaveLength(1);
    expect(resources[0]!.uri).toBe("bookkeeping://categories");
  });

  it("each tool has a zod inputSchema", () => {
    for (const t of tools) {
      expect(typeof (t.inputSchema as { safeParse?: unknown }).safeParse).toBe("function");
    }
  });

  it("each prompt has a render function", () => {
    for (const p of prompts) {
      expect(typeof p.render).toBe("function");
    }
  });
});
