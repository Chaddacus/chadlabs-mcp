import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockExtractor } from "@chadlabs/core";
import {
  TxnClassifyInputSchema,
  TxnClassifyOutputSchema,
  _setExtractor,
  _resetExtractor,
  txnClassifyTool,
  type TxnClassifyOutput,
} from "../tools/txn_classify.js";
import { transactionFixtures } from "../__fixtures__/transactions.js";

function unwrap<T>(envelope: { content: Array<{ type: string; text: string }> }): T {
  const text = envelope.content[0]?.text ?? "";
  return JSON.parse(text) as T;
}

const VALID_CATEGORIES = new Set([
  "Revenue", "Services Revenue", "Product Revenue", "Other Revenue",
  "COGS", "Direct Labor", "Subcontractors", "Direct Materials",
  "Operating Expenses", "Office & Admin", "Office Supplies",
  "Postage & Shipping", "Printing", "Technology", "Software & SaaS",
  "Hardware", "Cloud Hosting", "Domain & Website", "Travel & Meals",
  "Travel", "Meals & Entertainment", "Marketing", "Advertising",
  "Professional Fees", "Payroll & Benefits", "Salaries & Wages",
  "Payroll Taxes", "Benefits", "Other Expenses", "Uncategorized",
]);

describe("txn_classify tool", () => {
  beforeEach(() => {
    _setExtractor(
      mockExtractor(
        { name: "txn_classify", schema: TxnClassifyOutputSchema, systemPrompt: "" },
        (input: string) => {
          const txnMatch = input.match(/Transactions: (\[.*\])/s);
          let txnIds: string[] = [];
          if (txnMatch?.[1]) {
            try {
              const txns = JSON.parse(txnMatch[1]) as Array<{ id: string }>;
              txnIds = txns.map((t) => t.id);
            } catch {
              // fall through
            }
          }
          if (txnIds.length === 0) {
            txnIds = transactionFixtures.map((f) => f.id);
          }
          return {
            classifications: txnIds.map((id) => {
              const fixture = transactionFixtures.find((f) => f.id === id);
              return {
                id,
                category: fixture?.expected_category ?? "Uncategorized",
                confidence: 0.85,
                reason: "Mock classification based on fixture",
                vendor_normalized: fixture?.description.toLowerCase().split(" ")[0],
              };
            }),
          };
        }
      )
    );
  });

  afterEach(() => {
    _resetExtractor();
  });

  it("tool is named txn_classify", () => {
    expect(txnClassifyTool.name).toBe("txn_classify");
  });

  it("tool has a description", () => {
    expect(txnClassifyTool.description.length).toBeGreaterThan(10);
  });

  it("inputSchema rejects empty transactions array", () => {
    const result = TxnClassifyInputSchema.safeParse({ transactions: [] });
    expect(result.success).toBe(false);
  });

  it("classifies all 20 fixtures", async () => {
    const envelope = await txnClassifyTool.handler({
      transactions: transactionFixtures.map(({ id, date, amount, description }) => ({
        id,
        date,
        amount,
        description,
      })),
    });
    const parsed = TxnClassifyOutputSchema.parse(unwrap<TxnClassifyOutput>(envelope));
    expect(parsed.classifications).toHaveLength(20);
  });

  it("all classification fields are well-formed", async () => {
    const envelope = await txnClassifyTool.handler({
      transactions: transactionFixtures.map(({ id, date, amount, description }) => ({
        id,
        date,
        amount,
        description,
      })),
    });
    const parsed = TxnClassifyOutputSchema.parse(unwrap<TxnClassifyOutput>(envelope));
    for (const c of parsed.classifications) {
      expect(c.confidence).toBeGreaterThanOrEqual(0);
      expect(c.confidence).toBeLessThanOrEqual(1);
      expect(VALID_CATEGORIES.has(c.category)).toBe(true);
      expect(c.reason.length).toBeGreaterThan(0);
    }
  });

  it("accepts known_vendors hint without error", async () => {
    const envelope = await txnClassifyTool.handler({
      transactions: [transactionFixtures[0]!].map(({ id, date, amount, description }) => ({
        id,
        date,
        amount,
        description,
      })),
      known_vendors: [{ name: "OpenAI", default_category: "Software & SaaS" }],
    });
    const parsed = TxnClassifyOutputSchema.parse(unwrap<TxnClassifyOutput>(envelope));
    expect(parsed.classifications).toHaveLength(1);
  });
});
