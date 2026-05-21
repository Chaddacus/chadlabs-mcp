import { describe, it, expect } from "vitest";
import { tools } from "../server.js";

describe("bookkeeping MCP server", () => {
  it("exports exactly 3 tools", () => {
    expect(tools).toHaveLength(3);
  });

  it("registers invoice_extract, txn_classify, chase_draft", () => {
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["chase_draft", "invoice_extract", "txn_classify"]);
  });

  it("each tool has a non-empty description", () => {
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(10);
    }
  });

  it("each tool has a zod inputSchema (safeParse available)", () => {
    for (const t of tools) {
      expect(typeof (t.inputSchema as { safeParse?: unknown }).safeParse).toBe("function");
    }
  });
});
