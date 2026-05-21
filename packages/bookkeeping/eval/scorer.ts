import type {
  InvoiceFixture,
  InvoiceScoreRow,
  TxnFixture,
  TxnScoreRow,
} from "./types.js";

/**
 * Pull a fenced JSON object out of model output. Models occasionally wrap JSON
 * in ```json ... ``` fences despite "JSON only" instruction; tolerate it.
 */
export function extractJSONObject(raw: string): unknown {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenceMatch ? fenceMatch[1] ?? raw : raw;
  // Find first { ... } that parses
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error(`no JSON object found in: ${raw.slice(0, 200)}`);
  // Cheap: try from outermost brace; fall back to greedy.
  try {
    return JSON.parse(candidate.slice(start));
  } catch {
    const end = candidate.lastIndexOf("}");
    if (end <= start) throw new Error(`unbalanced braces in: ${raw.slice(0, 200)}`);
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

export function scoreInvoice(fixture: InvoiceFixture, raw: string): InvoiceScoreRow {
  try {
    const parsed = extractJSONObject(raw) as {
      vendor?: { normalized_name?: string };
      amount_total?: number;
      currency?: string;
      suggested_category?: string;
    };
    return {
      fixture_id: fixture.id,
      vendor_match:
        (parsed.vendor?.normalized_name ?? "").toLowerCase().trim() ===
        fixture.expected.vendor_normalized.toLowerCase().trim(),
      amount_match:
        typeof parsed.amount_total === "number" &&
        Math.abs(parsed.amount_total - fixture.expected.amount_total) < 0.01,
      currency_match:
        (parsed.currency ?? "").toUpperCase() === fixture.expected.currency.toUpperCase(),
      category_match:
        (parsed.suggested_category ?? "").toLowerCase().trim() ===
        fixture.expected.suggested_category.toLowerCase().trim(),
      notes: "",
    };
  } catch (err) {
    return {
      fixture_id: fixture.id,
      vendor_match: false,
      amount_match: false,
      currency_match: false,
      category_match: false,
      notes: String(err).slice(0, 160),
    };
  }
}

export function scoreTxnBatch(
  fixtures: TxnFixture[],
  raw: string
): { rows: TxnScoreRow[]; notes: string } {
  try {
    const parsed = extractJSONObject(raw) as {
      classifications?: Array<{ id: string; category?: string }>;
    };
    const byId = new Map(
      (parsed.classifications ?? []).map((c) => [c.id, c.category ?? "(missing)"])
    );
    const rows: TxnScoreRow[] = fixtures.map((f) => ({
      fixture_id: f.id,
      expected: f.expected_category,
      predicted: byId.get(f.id) ?? "(missing)",
      match:
        (byId.get(f.id) ?? "").toLowerCase().trim() ===
        f.expected_category.toLowerCase().trim(),
    }));
    return { rows, notes: "" };
  } catch (err) {
    return {
      rows: fixtures.map((f) => ({
        fixture_id: f.id,
        expected: f.expected_category,
        predicted: "(parse error)",
        match: false,
      })),
      notes: String(err).slice(0, 200),
    };
  }
}
