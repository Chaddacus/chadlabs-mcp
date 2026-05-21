import type { ClassifyFixture, ClassifyScoreRow } from "./types.js";

export function extractJSONObject(raw: string): unknown {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenceMatch ? fenceMatch[1] ?? raw : raw;
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error(`no JSON object found in: ${raw.slice(0, 200)}`);
  try {
    return JSON.parse(candidate.slice(start));
  } catch {
    const end = candidate.lastIndexOf("}");
    if (end <= start) throw new Error("unbalanced braces");
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

export function scoreClassify(
  fixture: ClassifyFixture,
  raw: string
): ClassifyScoreRow {
  try {
    const parsed = extractJSONObject(raw) as {
      denial_reason_code?: string;
      alternative_codes?: string[];
    };
    const predicted = (parsed.denial_reason_code ?? "").trim().toUpperCase();
    const expected = fixture.expected_reason_code.toUpperCase();
    const alts = (fixture.acceptable_alternatives ?? []).map((a) => a.toUpperCase());
    return {
      fixture_id: fixture.id,
      expected,
      predicted,
      exact_match: predicted === expected,
      alt_match: predicted !== expected && alts.includes(predicted),
    };
  } catch (err) {
    return {
      fixture_id: fixture.id,
      expected: fixture.expected_reason_code,
      predicted: "(parse_error)",
      exact_match: false,
      alt_match: false,
      parse_error: String(err).slice(0, 160),
    };
  }
}
