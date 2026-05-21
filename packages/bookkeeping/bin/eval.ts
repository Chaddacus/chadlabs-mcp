#!/usr/bin/env node
/**
 * Multi-host prompt evaluation harness.
 *
 * Renders our prompts against each configured provider and scores accuracy
 * against hand-labeled fixtures. Not used at runtime by the MCP — this is
 * our internal cross-model quality story for the launch.
 *
 * Examples:
 *   ANTHROPIC_API_KEY=sk-... pnpm --filter @chadlabs/bookkeeping eval invoice anthropic
 *   OPENAI_API_KEY=sk-... pnpm --filter @chadlabs/bookkeeping eval invoice openai gpt-4o
 *   OLLAMA_HOST=http://localhost:11434 pnpm --filter @chadlabs/bookkeeping eval invoice ollama llama3.3:70b
 *   pnpm --filter @chadlabs/bookkeeping eval invoice all     # every configured provider
 *
 *   pnpm --filter @chadlabs/bookkeeping eval txn anthropic
 *   pnpm --filter @chadlabs/bookkeeping eval both all
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { invoiceExtractPrompt } from "../src/prompts/invoice_extract.js";
import { txnClassifyPrompt } from "../src/prompts/txn_classify.js";
import { CATEGORIES_MARKDOWN } from "../src/resources/categories.js";
import { INVOICE_FIXTURES, TXN_FIXTURES } from "../eval/fixtures.js";
import {
  ALL_PROVIDERS,
  availableProviders,
  findProvider,
} from "../eval/providers/index.js";
import { scoreInvoice, scoreTxnBatch } from "../eval/scorer.js";
import {
  renderInvoiceReport,
  renderTopMatter,
  renderTxnReport,
} from "../eval/report.js";
import type { LLMProvider, ProviderRunSummary } from "../eval/types.js";

function outputDir(): string {
  const dir = resolve(process.cwd(), "benchmarks");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function runInvoice(provider: LLMProvider, model: string): Promise<ProviderRunSummary> {
  const errors: string[] = [];
  let totalLatency = 0;
  let inputTokens: number | null = 0;
  let outputTokens: number | null = 0;
  const rows: ReturnType<typeof scoreInvoice>[] = [];

  for (const fixture of INVOICE_FIXTURES) {
    try {
      const rendered = invoiceExtractPrompt.render({
        email_body: fixture.email_body,
        email_from: fixture.email_from,
        email_subject: fixture.email_subject,
        categories_markdown: CATEGORIES_MARKDOWN,
      });
      const systemText = rendered.messages[0]!.content.text;
      const userText = rendered.messages[1]!.content.text;
      const resp = await provider.complete({ systemText, userText, model });
      totalLatency += resp.latencyMs;
      if (resp.inputTokens !== null && inputTokens !== null)
        inputTokens += resp.inputTokens;
      else inputTokens = null;
      if (resp.outputTokens !== null && outputTokens !== null)
        outputTokens += resp.outputTokens;
      else outputTokens = null;
      rows.push(scoreInvoice(fixture, resp.rawText));
    } catch (err) {
      errors.push(`${fixture.id}: ${err}`);
      rows.push({
        fixture_id: fixture.id,
        vendor_match: false,
        amount_match: false,
        currency_match: false,
        category_match: false,
        notes: String(err).slice(0, 160),
      });
    }
  }

  return {
    provider_id: provider.id,
    provider_name: provider.name,
    model,
    prompt_id: "invoice_extract",
    rows,
    total_latency_ms: totalLatency,
    total_input_tokens: inputTokens,
    total_output_tokens: outputTokens,
    errors,
  };
}

async function runTxn(provider: LLMProvider, model: string): Promise<ProviderRunSummary> {
  const errors: string[] = [];

  const rendered = txnClassifyPrompt.render({
    transactions_json: JSON.stringify(
      TXN_FIXTURES.map(({ id, date, amount, description }) => ({
        id,
        date,
        amount,
        description,
      }))
    ),
    categories_markdown: CATEGORIES_MARKDOWN,
  });
  const systemText = rendered.messages[0]!.content.text;
  const userText = rendered.messages[1]!.content.text;

  try {
    const resp = await provider.complete({ systemText, userText, model });
    const { rows, notes } = scoreTxnBatch(TXN_FIXTURES, resp.rawText);
    if (notes) errors.push(notes);
    return {
      provider_id: provider.id,
      provider_name: provider.name,
      model,
      prompt_id: "txn_classify",
      rows,
      total_latency_ms: resp.latencyMs,
      total_input_tokens: resp.inputTokens,
      total_output_tokens: resp.outputTokens,
      errors,
    };
  } catch (err) {
    return {
      provider_id: provider.id,
      provider_name: provider.name,
      model,
      prompt_id: "txn_classify",
      rows: TXN_FIXTURES.map((f) => ({
        fixture_id: f.id,
        expected: f.expected_category,
        predicted: "(provider error)",
        match: false,
      })),
      total_latency_ms: 0,
      total_input_tokens: null,
      total_output_tokens: null,
      errors: [String(err)],
    };
  }
}

function selectedProviders(arg: string | undefined): LLMProvider[] {
  if (!arg || arg === "all") {
    const available = availableProviders();
    if (available.length === 0) {
      console.error(
        "No providers configured. Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, OLLAMA_AVAILABLE=1 (with OLLAMA_HOST), LMSTUDIO_AVAILABLE=1."
      );
      console.error("Available providers:", ALL_PROVIDERS.map((p) => p.id).join(", "));
      process.exit(2);
    }
    return available;
  }
  const p = findProvider(arg);
  if (!p) {
    console.error(`Unknown provider: ${arg}`);
    console.error("Known:", ALL_PROVIDERS.map((p) => p.id).join(", "));
    process.exit(2);
  }
  return [p];
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const promptArg = (args[0] ?? "both") as "invoice" | "txn" | "both";
  const providerArg = args[1];
  const modelArg = args[2];

  if (!["invoice", "txn", "both"].includes(promptArg)) {
    console.error(`Unknown prompt: ${promptArg}. Use invoice | txn | both.`);
    process.exit(2);
  }

  const providers = selectedProviders(providerArg);

  const dir = outputDir();
  const now = new Date();

  if (promptArg === "invoice" || promptArg === "both") {
    const summaries: ProviderRunSummary[] = [];
    for (const p of providers) {
      const model = modelArg ?? p.defaultModel();
      process.stderr.write(`Running invoice_extract on ${p.id} (${model})... `);
      const s = await runInvoice(p, model);
      process.stderr.write(`done in ${(s.total_latency_ms / 1000).toFixed(1)}s\n`);
      summaries.push(s);
    }
    const md =
      renderTopMatter("invoice_extract", now, summaries) +
      summaries.map(renderInvoiceReport).join("\n");
    const path = resolve(dir, "invoice-extract-cross-host.md");
    writeFileSync(path, md);
    console.log(`wrote ${path}`);
  }

  if (promptArg === "txn" || promptArg === "both") {
    const summaries: ProviderRunSummary[] = [];
    for (const p of providers) {
      const model = modelArg ?? p.defaultModel();
      process.stderr.write(`Running txn_classify on ${p.id} (${model})... `);
      const s = await runTxn(p, model);
      process.stderr.write(`done in ${(s.total_latency_ms / 1000).toFixed(1)}s\n`);
      summaries.push(s);
    }
    const md =
      renderTopMatter("txn_classify", now, summaries) +
      summaries.map(renderTxnReport).join("\n");
    const path = resolve(dir, "txn-classify-cross-host.md");
    writeFileSync(path, md);
    console.log(`wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
