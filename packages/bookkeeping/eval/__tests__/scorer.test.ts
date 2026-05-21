import { describe, it, expect } from "vitest";
import { extractJSONObject, scoreInvoice, scoreTxnBatch } from "../scorer.js";
import { INVOICE_FIXTURES, TXN_FIXTURES } from "../fixtures.js";

describe("extractJSONObject", () => {
  it("parses a clean JSON object", () => {
    const out = extractJSONObject('{"a":1,"b":2}');
    expect(out).toEqual({ a: 1, b: 2 });
  });

  it("strips ```json fences", () => {
    const out = extractJSONObject('```json\n{"a":1}\n```');
    expect(out).toEqual({ a: 1 });
  });

  it("strips bare ``` fences", () => {
    const out = extractJSONObject('```\n{"a":1}\n```');
    expect(out).toEqual({ a: 1 });
  });

  it("tolerates leading commentary", () => {
    const out = extractJSONObject('Here is the JSON:\n{"a":1}');
    expect(out).toEqual({ a: 1 });
  });

  it("throws on garbage", () => {
    expect(() => extractJSONObject("absolutely no json here")).toThrow();
  });
});

describe("scoreInvoice", () => {
  const fixture = INVOICE_FIXTURES[0]!;

  it("scores a perfect extraction as all-true", () => {
    const raw = JSON.stringify({
      vendor: {
        name: "Notion",
        normalized_name: fixture.expected.vendor_normalized,
      },
      amount_total: fixture.expected.amount_total,
      currency: fixture.expected.currency,
      suggested_category: fixture.expected.suggested_category,
    });
    const row = scoreInvoice(fixture, raw);
    expect(row.vendor_match).toBe(true);
    expect(row.amount_match).toBe(true);
    expect(row.currency_match).toBe(true);
    expect(row.category_match).toBe(true);
  });

  it("catches wrong vendor", () => {
    const raw = JSON.stringify({
      vendor: { normalized_name: "wrong" },
      amount_total: fixture.expected.amount_total,
      currency: fixture.expected.currency,
      suggested_category: fixture.expected.suggested_category,
    });
    const row = scoreInvoice(fixture, raw);
    expect(row.vendor_match).toBe(false);
  });

  it("catches amount drift > 1 cent", () => {
    const raw = JSON.stringify({
      vendor: { normalized_name: fixture.expected.vendor_normalized },
      amount_total: fixture.expected.amount_total + 0.5,
      currency: fixture.expected.currency,
      suggested_category: fixture.expected.suggested_category,
    });
    const row = scoreInvoice(fixture, raw);
    expect(row.amount_match).toBe(false);
  });

  it("records notes on parse failure", () => {
    const row = scoreInvoice(fixture, "not json at all");
    expect(row.notes.length).toBeGreaterThan(0);
    expect(row.vendor_match).toBe(false);
  });
});

describe("scoreTxnBatch", () => {
  it("matches by id and reports hits", () => {
    const raw = JSON.stringify({
      classifications: TXN_FIXTURES.slice(0, 3).map((f) => ({
        id: f.id,
        category: f.expected_category,
      })),
    });
    const { rows } = scoreTxnBatch(TXN_FIXTURES.slice(0, 3), raw);
    expect(rows.every((r) => r.match)).toBe(true);
  });

  it("flags missing id as non-match", () => {
    const raw = JSON.stringify({
      classifications: [{ id: "t1", category: TXN_FIXTURES[0]!.expected_category }],
    });
    const { rows } = scoreTxnBatch(TXN_FIXTURES.slice(0, 2), raw);
    expect(rows[0]?.match).toBe(true);
    expect(rows[1]?.match).toBe(false);
    expect(rows[1]?.predicted).toBe("(missing)");
  });

  it("flags wrong category", () => {
    const raw = JSON.stringify({
      classifications: [{ id: "t1", category: "Travel" }],
    });
    const fixtures = [TXN_FIXTURES[0]!]; // expected_category = Software & SaaS
    const { rows } = scoreTxnBatch(fixtures, raw);
    expect(rows[0]?.match).toBe(false);
  });
});
