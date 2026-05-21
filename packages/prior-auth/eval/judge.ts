/**
 * LLM-as-judge. A stronger model grades the executor model's output against a
 * rubric. Used for prose outputs (appeal letters) where deterministic field
 * checks don't apply.
 *
 * Judge model is OpenRouter / claude-sonnet-4.5 by default. The executor can
 * be the same model — bias risk acknowledged in the report. Mitigations:
 * 1. The rubric is hand-written, fixture-specific, and very concrete.
 * 2. Judge sees the rubric only, not the executor's identity.
 * 3. The 24/30 pass threshold is high enough that lazy "looks fine" judgments
 *    don't pass.
 */
import type { LLMProvider, JudgeRubricScores } from "./types.js";

const JUDGE_SYSTEM = `You are an experienced healthcare denial-appeal reviewer grading an appeal letter that was drafted by an AI assistant for a clinician/billing manager to use.

You will be given:
1. The original denial (payer, reason code, denial text).
2. The clinical facts the assistant had to work with.
3. The hand-written rubric for THIS specific denial — what a good letter must cover.
4. The assistant's output (raw JSON).

Score each of these 6 dimensions on a 0-5 integer scale where 5 = excellent, 3 = acceptable, 0 = absent or wrong:

- cites_real_reason_code: did the assistant cite the canonical denial reason code from the rubric correctly?
- specific_not_generic: are facts/dates/codes/treatments from the input named specifically, vs vague boilerplate?
- no_hallucinated_facts: did the assistant invent diagnoses, treatments, outcomes, or rules not in the input? (5 = none, 0 = many)
- clear_remedy_requested: is a specific remedy explicitly requested (overturn / P2P / external review / retrospective review / formulary exception)?
- professional_tone: appropriate to the chosen tone, no sloppy phrasing, no obvious AI tells?
- schema_valid: did the output JSON parse cleanly and include subject + body_markdown + body_plain + suggested_attachments + cited_codes?

Return ONLY a JSON object, no preamble, no markdown fences:

{
  "scores": {
    "cites_real_reason_code": 0-5,
    "specific_not_generic": 0-5,
    "no_hallucinated_facts": 0-5,
    "clear_remedy_requested": 0-5,
    "professional_tone": 0-5,
    "schema_valid": 0-5
  },
  "critique": "1-3 sentences pointing to the specific text that drove the lowest scores."
}`;

export interface JudgeInput {
  denial: unknown;
  clinical_facts: unknown;
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
    `# Original denial`,
    "```json",
    JSON.stringify(input.denial, null, 2),
    "```",
    "",
    `# Clinical facts`,
    "```json",
    JSON.stringify(input.clinical_facts, null, 2),
    "```",
    "",
    `# Rubric for THIS denial`,
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

  // Sanity-clamp scores to 0..5 integers.
  const clamp = (n: unknown): number => {
    const x = typeof n === "number" ? Math.round(n) : 0;
    return Math.max(0, Math.min(5, x));
  };
  return {
    scores: {
      cites_real_reason_code: clamp(parsed.scores?.cites_real_reason_code),
      specific_not_generic: clamp(parsed.scores?.specific_not_generic),
      no_hallucinated_facts: clamp(parsed.scores?.no_hallucinated_facts),
      clear_remedy_requested: clamp(parsed.scores?.clear_remedy_requested),
      professional_tone: clamp(parsed.scores?.professional_tone),
      schema_valid: clamp(parsed.scores?.schema_valid),
    },
    critique: typeof parsed.critique === "string" ? parsed.critique : "",
  };
}

export function totalScore(s: JudgeRubricScores): number {
  return (
    s.cites_real_reason_code +
    s.specific_not_generic +
    s.no_hallucinated_facts +
    s.clear_remedy_requested +
    s.professional_tone +
    s.schema_valid
  );
}
