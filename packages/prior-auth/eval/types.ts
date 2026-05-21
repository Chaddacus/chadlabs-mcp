/**
 * Eval types. Mirrors the bookkeeping eval-harness shape but adds an
 * LLM-as-judge path for prose outputs (appeal letters) where deterministic
 * field-checking doesn't apply.
 */

export interface ProviderRequest {
  systemText: string;
  userText: string;
  model: string;
}

export interface ProviderResponse {
  rawText: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  available(): boolean;
  defaultModel(): string;
  complete(req: ProviderRequest): Promise<ProviderResponse>;
}

/* Deterministic eval (denial_classify): expected top-1 reason code. */
export interface ClassifyFixture {
  id: string;
  denial_text: string;
  expected_reason_code: string;
  /** Acceptable alternative codes if the canonical pick is debatable. */
  acceptable_alternatives?: string[];
}

export interface ClassifyScoreRow {
  fixture_id: string;
  expected: string;
  predicted: string;
  exact_match: boolean;
  alt_match: boolean;
  parse_error?: string;
}

/* LLM-as-judge eval (appeal_letter_draft): prose output graded by a critic. */
export interface AppealFixture {
  id: string;
  denial: {
    payer: string;
    claim_id: string;
    member_id: string;
    denial_reason_code: string;
    denial_reason_text: string;
    raw_excerpt: string;
    date_of_service: string;
  };
  clinical_facts: {
    diagnosis_codes: string[];
    prior_treatments_tried: string[];
    clinical_summary: string;
    supporting_citations: string[];
  };
  /** Hand-written description of what a "good" letter for this denial covers. */
  rubric: string;
}

export interface JudgeRubricScores {
  cites_real_reason_code: number;       // 0..5 — did it cite from the canonical taxonomy
  specific_not_generic: number;          // 0..5 — names specific clinical facts, dates, codes
  no_hallucinated_facts: number;         // 0..5 — invented diagnoses/outcomes?
  clear_remedy_requested: number;        // 0..5 — overturn / P2P / external review explicitly asked
  professional_tone: number;             // 0..5
  schema_valid: number;                  // 0..5 — JSON parses + has required fields
}

export interface AppealScoreRow {
  fixture_id: string;
  /** The executor's raw output (pre-judge). */
  raw_output: string;
  scores: JudgeRubricScores | null;
  judge_critique: string;
  total_score: number;     // sum, max = 6*5 = 30
  pass: boolean;            // total_score >= 24 (80%)
  parse_error?: string;
  judge_error?: string;
}

export interface ProviderRunSummary<R> {
  provider_id: string;
  provider_name: string;
  model: string;
  prompt_id: "denial_classify" | "appeal_letter_draft";
  rows: R[];
  total_latency_ms: number;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  errors: string[];
}
