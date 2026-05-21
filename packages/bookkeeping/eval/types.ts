/**
 * Multi-host prompt-evaluation harness.
 *
 * Renders our prompts against each provider's model and scores the output
 * against hand-labeled fixtures. NOT used at runtime by the MCP server (which
 * makes zero LLM calls). This is our internal cross-model quality report.
 */

export interface ProviderRequest {
  systemText: string;
  userText: string;
  /**
   * Identifier passed to the provider (e.g. "claude-sonnet-4-5" or "llama3.3:70b").
   * Provider may ignore if it has only one configured model.
   */
  model: string;
}

export interface ProviderResponse {
  rawText: string;
  /** Tokens or "events" if the provider exposes a count; null otherwise. */
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
}

export interface LLMProvider {
  /** Stable ID used in CLI args and report headers. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Returns true iff env is configured to use this provider. */
  available(): boolean;
  /** Defaults the user gets if --model is omitted. */
  defaultModel(): string;
  /** Make the call. Throws on transport/parsing failure. */
  complete(req: ProviderRequest): Promise<ProviderResponse>;
}

export interface InvoiceFixture {
  id: string;
  email_from: string;
  email_subject: string;
  email_body: string;
  expected: {
    vendor_normalized: string;
    amount_total: number;
    currency: string;
    suggested_category: string;
  };
}

export interface TxnFixture {
  id: string;
  date: string;
  amount: number;
  description: string;
  expected_category: string;
}

export interface InvoiceScoreRow {
  fixture_id: string;
  vendor_match: boolean;
  amount_match: boolean;
  currency_match: boolean;
  category_match: boolean;
  notes: string;
}

export interface TxnScoreRow {
  fixture_id: string;
  expected: string;
  predicted: string;
  match: boolean;
}

export interface ProviderRunSummary {
  provider_id: string;
  provider_name: string;
  model: string;
  prompt_id: "invoice_extract" | "txn_classify";
  rows: InvoiceScoreRow[] | TxnScoreRow[];
  total_latency_ms: number;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  errors: string[];
}
