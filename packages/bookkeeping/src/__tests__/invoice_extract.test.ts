import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockExtractor } from "@chadlabs/core";
import {
  InvoiceExtractInputSchema,
  InvoiceExtractOutputSchema,
  _setExtractor,
  _resetExtractor,
  invoiceExtractTool,
  type InvoiceExtractOutput,
} from "../tools/invoice_extract.js";
import { invoiceFixtures } from "../__fixtures__/invoices.js";

function unwrap<T>(envelope: { content: Array<{ type: string; text: string }> }): T {
  const text = envelope.content[0]?.text ?? "";
  return JSON.parse(text) as T;
}

describe("invoice_extract tool", () => {
  beforeEach(() => {
    _setExtractor(
      mockExtractor(
        {
          name: "invoice_extract",
          schema: InvoiceExtractOutputSchema,
          systemPrompt: "",
        },
        (input: string) => {
          const fixture =
            invoiceFixtures.find(
              (f) =>
                input.includes(f.expected.vendor_normalized) ||
                input.toLowerCase().includes(f.expected.vendor_name.toLowerCase())
            ) ?? invoiceFixtures[0]!;
          return {
            vendor: {
              name: fixture.expected.vendor_name,
              normalized_name: fixture.expected.vendor_normalized,
            },
            amount_total: fixture.expected.amount_total,
            currency: fixture.expected.currency,
            line_items: [
              { description: "Service", amount: fixture.expected.amount_total },
            ],
            suggested_category: fixture.expected.suggested_category,
            confidence: 0.92,
            notes: [],
          };
        }
      )
    );
  });

  afterEach(() => {
    _resetExtractor();
  });

  it("tool is named invoice_extract", () => {
    expect(invoiceExtractTool.name).toBe("invoice_extract");
  });

  it("tool has a description", () => {
    expect(invoiceExtractTool.description.length).toBeGreaterThan(10);
  });

  it("inputSchema rejects empty input", () => {
    const result = InvoiceExtractInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it.each(invoiceFixtures)(
    "fixture $id produces well-formed output",
    async (fixture) => {
      const envelope = await invoiceExtractTool.handler({
        email_body: fixture.email_body,
        email_from: fixture.email_from,
        email_subject: fixture.email_subject,
      });
      const data = InvoiceExtractOutputSchema.parse(unwrap<InvoiceExtractOutput>(envelope));

      expect(data.amount_total).toBeGreaterThan(0);
      expect(data.confidence).toBeGreaterThanOrEqual(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
      expect(data.vendor.name.length).toBeGreaterThan(0);
      expect(data.vendor.normalized_name.length).toBeGreaterThan(0);
      expect(Array.isArray(data.line_items)).toBe(true);
      expect(Array.isArray(data.notes)).toBe(true);
      expect(data.suggested_category.length).toBeGreaterThan(0);
      expect(["USD", "CAD", "EUR", "GBP"]).toContain(data.currency);
    }
  );

  it("all 5 fixtures return valid output", async () => {
    const results = await Promise.all(
      invoiceFixtures.map((f) =>
        invoiceExtractTool.handler({
          email_body: f.email_body,
          email_from: f.email_from,
          email_subject: f.email_subject,
        })
      )
    );
    expect(results).toHaveLength(5);
    for (const r of results) {
      const data = unwrap<InvoiceExtractOutput>(r);
      const parsed = InvoiceExtractOutputSchema.safeParse(data);
      expect(parsed.success).toBe(true);
    }
  });
});
