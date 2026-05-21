/**
 * LLM-as-judge for dispute_email_draft. A stronger model grades the executor
 * model's email against a fixture-specific rubric.
 *
 * Bias: when judge == executor, "looks fine" judgments may inflate scores.
 * Mitigations:
 *  - Rubric is hand-written, fixture-specific, and concrete (names policy
 *    numbers and dollar amounts).
 *  - Judge sees the rubric only, not the executor's identity.
 *  - Pass threshold (24/30 = 80%) is high enough that lazy passes don't slip.
 */
import type { LLMProvider, JudgeRubricScores } from "./types.js";

const JUDGE_SYSTEM = `You are an experienced commission-disputes reviewer at an independent insurance brokerage. You are grading a dispute email drafted by an AI assistant for an agency owner to send to a carrier's producer-services team.

You will be given:
1. The discrepancy record (policy number, carrier, statement period, expected vs actual commission, status, notes).
2. The requested tone (friendly | firm) and any prior history.
3. The hand-written rubric for THIS specific discrepancy.
4. The assistant's output (raw JSON).

Score each of these 6 dimensions on a 0-5 integer scale where 5 = excellent, 3 = acceptable, 0 = absent or wrong:

- cites_specific_numbers: did the email name the policy number, statement period, and the dollar delta (or both amounts) explicitly?
- no_hallucinated_facts: did the assistant invent rates, dates, names, balances, or producer-agreement clauses not in the input? (5 = none, 0 = many)
- clear_ask: does the email end with a specific, actionable remedy (corrected statement, reissue payment, schedule a call, written response within N days)?
- tone_match: does the email match the requested tone (friendly = polite opener and warmth; firm = direct, deadlines, no padding)?
- professional_tone: appropriate, no sloppy phrasing, no AI tells.
- schema_valid: did the JSON parse cleanly and include subject + body_markdown + body_plain + attachments_suggested?

Return ONLY a JSON object, no preamble, no markdown fences:

{
  "scores": {
    "cites_specific_numbers": 0-5,
    "no_hallucinated_facts": 0-5,
    "clear_ask": 0-5,
    "tone_match": 0-5,
    "professional_tone": 0-5,
    "schema_valid": 0-5
  },
  "critique": "1-3 sentences pointing to the specific text that drove the lowest scores."
}`;

export interface JudgeInput {
  discrepancy: unknown;
  tone: string;
  policy_history: unknown;
  rubric: string;
  output_raw: string;
}

export interface JudgeResult {
  scores: JudgeRubricScores;
  critique: string;
}

export async function runJudge(
  provider: LLMProvider,
  model: string,
  input: JudgeInput
): Promise<JudgeResult> {
  const userText = [
    `# Discrepancy`,
    "```json",
    JSON.stringify(input.discrepancy, null, 2),
    "```",
    "",
    `# Requested tone`,
    input.tone,
    "",
    ...(input.policy_history
      ? ["# Prior history", "```json", JSON.stringify(input.policy_history, null, 2), "```", ""]
      : []),
    `# Rubric for THIS discrepancy`,
    input.rubric,
    "",
    `# Assistant output (raw)`,
    "```",
    input.output_raw,
    "```",
  ].join("\n");

  const res = await provider.complete({
    systemText: JUDGE_SYSTEM,
    userText,
    model,
  });

  const raw = res.rawText;
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenceMatch ? fenceMatch[1] ?? raw : raw;
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error(`judge returned no JSON: ${raw.slice(0, 200)}`);
  let parsed: { scores: JudgeRubricScores; critique: string };
  try {
    parsed = JSON.parse(candidate.slice(start));
  } catch {
    const end = candidate.lastIndexOf("}");
    if (end <= start) throw new Error(`judge JSON unbalanced: ${raw.slice(0, 200)}`);
    parsed = JSON.parse(candidate.slice(start, end + 1));
  }

  const clamp = (n: unknown): number => {
    const x = typeof n === "number" ? Math.round(n) : 0;
    return Math.max(0, Math.min(5, x));
  };
  return {
    scores: {
      cites_specific_numbers: clamp(parsed.scores?.cites_specific_numbers),
      no_hallucinated_facts: clamp(parsed.scores?.no_hallucinated_facts),
      clear_ask: clamp(parsed.scores?.clear_ask),
      tone_match: clamp(parsed.scores?.tone_match),
      professional_tone: clamp(parsed.scores?.professional_tone),
      schema_valid: clamp(parsed.scores?.schema_valid),
    },
    critique: typeof parsed.critique === "string" ? parsed.critique : "",
  };
}

export function totalScore(s: JudgeRubricScores): number {
  return (
    s.cites_specific_numbers +
    s.no_hallucinated_facts +
    s.clear_ask +
    s.tone_match +
    s.professional_tone +
    s.schema_valid
  );
}
