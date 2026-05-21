/**
 * Eval types for @chadlabs/commission-recon.
 *
 * Output of dispute_email_draft is prose, so we use an LLM-as-judge against
 * a fixture-specific rubric.
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

export interface DisputeFixture {
  id: string;
  discrepancy: {
    policy_number: string;
    carrier: string;
    statement_period: string;
    expected_commission: number;
    actual_commission: number;
    status: string;
    notes?: string;
  };
  tone: "friendly" | "firm";
  policy_history?: unknown;
  /** Hand-written description of what a good dispute email covers. */
  rubric: string;
}

export interface JudgeRubricScores {
  cites_specific_numbers: number;    // policy #, $ amount, statement period
  no_hallucinated_facts: number;     // didn't invent rates, names, balances
  clear_ask: number;                  // specific remedy: reissue, corrected statement, call
  tone_match: number;                 // matches requested tone
  professional_tone: number;
  schema_valid: number;               // JSON parses + has subject/body_markdown/body_plain/attachments_suggested
}

export interface DisputeScoreRow {
  fixture_id: string;
  raw_output: string;
  scores: JudgeRubricScores | null;
  judge_critique: string;
  total_score: number;
  pass: boolean;
  parse_error?: string;
  judge_error?: string;
}
