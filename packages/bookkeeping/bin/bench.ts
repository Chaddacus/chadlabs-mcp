#!/usr/bin/env node
/**
 * Benchmark harness for @chadlabs/bookkeeping.
 *
 * Modes:
 *   mock  — uses mockExtractor; verifies the harness wiring. Free, fast.
 *   real  — calls Anthropic API via @chadlabs/core defineExtractor.
 *           Requires ANTHROPIC_API_KEY in env. Costs tokens. Run before launch.
 *
 * Subcommands:
 *   invoice  — score invoice_extract against fixtures
 *   txn      — score txn_classify against fixtures
 *   all      — run both
 *
 * Writes markdown reports to ./benchmarks/.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { mockExtractor, defineExtractor } from "@chadlabs/core";
import {
  InvoiceExtractOutputSchema,
  _setExtractor as _setInvoiceExtractor,
  _resetExtractor as _resetInvoiceExtractor,
  invoiceExtractTool,
} from "../src/tools/invoice_extract.js";
import {
  TxnClassifyOutputSchema,
  _setExtractor as _setTxnExtractor,
  _resetExtractor as _resetTxnExtractor,
  txnClassifyTool,
} from "../src/tools/txn_classify.js";
import { invoiceFixtures } from "../src/__fixtures__/invoices.js";
import { transactionFixtures } from "../src/__fixtures__/transactions.js";

type Mode = "mock" | "real";
type Subcommand = "invoice" | "txn" | "all";

interface InvoiceScoreRow {
  id: string;
  vendor_match: boolean;
  amount_match: boolean;
  currency_match: boolean;
  category_match: boolean;
  notes: string;
}

interface TxnScoreRow {
  id: string;
  expected: string;
  predicted: string;
  match: boolean;
}

function unwrap<T>(envelope: { content: Array<{ type: string; text: string }> }): T {
  const text = envelope.content[0]?.text ?? "";
  return JSON.parse(text) as T;
}

function pct(num: number, denom: number): string {
  if (denom === 0) return "n/a";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function ensureOutputDir(): string {
  const dir = resolve(process.cwd(), "benchmarks");
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ---- invoice benchmark -----------------------------------------------------

async function runInvoiceBench(mode: Mode): Promise<InvoiceScoreRow[]> {
  if (mode === "mock") {
    _setInvoiceExtractor(
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
  } else {
    _setInvoiceExtractor(
      defineExtractor({
        name: "invoice_extract",
        schema: InvoiceExtractOutputSchema,
        systemPrompt: extractSystemPrompt(),
      })
    );
  }

  const rows: InvoiceScoreRow[] = [];
  for (const fixture of invoiceFixtures) {
    let row: InvoiceScoreRow;
    try {
      const envelope = await invoiceExtractTool.handler({
        email_body: fixture.email_body,
        email_from: fixture.email_from,
        email_subject: fixture.email_subject,
      });
      const data = unwrap<{
        vendor: { normalized_name: string };
        amount_total: number;
        currency: string;
        suggested_category: string;
      }>(envelope);

      row = {
        id: fixture.id,
        vendor_match:
          data.vendor.normalized_name.toLowerCase() ===
          fixture.expected.vendor_normalized.toLowerCase(),
        amount_match: Math.abs(data.amount_total - fixture.expected.amount_total) < 0.01,
        currency_match: data.currency === fixture.expected.currency,
        category_match:
          data.suggested_category.toLowerCase() ===
          fixture.expected.suggested_category.toLowerCase(),
        notes: "",
      };
    } catch (err) {
      row = {
        id: fixture.id,
        vendor_match: false,
        amount_match: false,
        currency_match: false,
        category_match: false,
        notes: String(err),
      };
    }
    rows.push(row);
  }

  _resetInvoiceExtractor();
  return rows;
}

function renderInvoiceReport(rows: InvoiceScoreRow[], mode: Mode): string {
  const n = rows.length;
  const vendor = rows.filter((r) => r.vendor_match).length;
  const amount = rows.filter((r) => r.amount_match).length;
  const currency = rows.filter((r) => r.currency_match).length;
  const category = rows.filter((r) => r.category_match).length;

  const lines: string[] = [];
  lines.push(`# invoice_extract — accuracy benchmark`);
  lines.push("");
  lines.push(`- mode: \`${mode}\``);
  lines.push(`- generated: ${new Date().toISOString()}`);
  lines.push(`- corpus: ${n} synthetic invoice emails`);
  lines.push("");
  lines.push(`## Field-level accuracy`);
  lines.push("");
  lines.push(`| Field | Hits | Total | Accuracy | Threshold | Pass |`);
  lines.push(`|---|---|---|---|---|---|`);
  lines.push(`| vendor.normalized_name | ${vendor} | ${n} | ${pct(vendor, n)} | 85% | ${vendor / n >= 0.85 ? "✅" : "❌"} |`);
  lines.push(`| amount_total | ${amount} | ${n} | ${pct(amount, n)} | 95% | ${amount / n >= 0.95 ? "✅" : "❌"} |`);
  lines.push(`| currency | ${currency} | ${n} | ${pct(currency, n)} | 95% | ${currency / n >= 0.95 ? "✅" : "❌"} |`);
  lines.push(`| suggested_category | ${category} | ${n} | ${pct(category, n)} | 80% | ${category / n >= 0.8 ? "✅" : "❌"} |`);
  lines.push("");
  lines.push(`## Per-fixture results`);
  lines.push("");
  lines.push(`| ID | vendor | amount | currency | category | notes |`);
  lines.push(`|---|---|---|---|---|---|`);
  for (const r of rows) {
    lines.push(
      `| ${r.id} | ${r.vendor_match ? "✅" : "❌"} | ${r.amount_match ? "✅" : "❌"} | ${r.currency_match ? "✅" : "❌"} | ${r.category_match ? "✅" : "❌"} | ${r.notes || ""} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ---- txn benchmark ---------------------------------------------------------

async function runTxnBench(mode: Mode): Promise<TxnScoreRow[]> {
  if (mode === "mock") {
    _setTxnExtractor(
      mockExtractor(
        { name: "txn_classify", schema: TxnClassifyOutputSchema, systemPrompt: "" },
        (input: string) => {
          const txnMatch = input.match(/Transactions: (\[.*\])/s);
          let txnIds: string[] = [];
          if (txnMatch?.[1]) {
            try {
              const txns = JSON.parse(txnMatch[1]) as Array<{ id: string }>;
              txnIds = txns.map((t) => t.id);
            } catch {
              // fall through
            }
          }
          return {
            classifications: txnIds.map((id) => {
              const fixture = transactionFixtures.find((f) => f.id === id);
              return {
                id,
                category: fixture?.expected_category ?? "Uncategorized",
                confidence: 0.85,
                reason: "mock",
              };
            }),
          };
        }
      )
    );
  } else {
    _setTxnExtractor(
      defineExtractor({
        name: "txn_classify",
        schema: TxnClassifyOutputSchema,
        systemPrompt: txnClassifySystemPrompt(),
      })
    );
  }

  const envelope = await txnClassifyTool.handler({
    transactions: transactionFixtures.map(({ id, date, amount, description }) => ({
      id,
      date,
      amount,
      description,
    })),
  });
  const data = unwrap<{ classifications: Array<{ id: string; category: string }> }>(envelope);
  const predictedById = new Map(data.classifications.map((c) => [c.id, c.category]));

  const rows: TxnScoreRow[] = transactionFixtures.map((f) => ({
    id: f.id,
    expected: f.expected_category,
    predicted: predictedById.get(f.id) ?? "(missing)",
    match: (predictedById.get(f.id) ?? "").toLowerCase() === f.expected_category.toLowerCase(),
  }));

  _resetTxnExtractor();
  return rows;
}

function renderTxnReport(rows: TxnScoreRow[], mode: Mode): string {
  const n = rows.length;
  const hits = rows.filter((r) => r.match).length;

  const lines: string[] = [];
  lines.push(`# txn_classify — accuracy benchmark`);
  lines.push("");
  lines.push(`- mode: \`${mode}\``);
  lines.push(`- generated: ${new Date().toISOString()}`);
  lines.push(`- corpus: ${n} synthetic transactions`);
  lines.push("");
  lines.push(`## Top-1 category accuracy`);
  lines.push("");
  lines.push(`| Hits | Total | Accuracy | Threshold | Pass |`);
  lines.push(`|---|---|---|---|---|`);
  lines.push(`| ${hits} | ${n} | ${pct(hits, n)} | 85% | ${hits / n >= 0.85 ? "✅" : "❌"} |`);
  lines.push("");
  lines.push(`## Misclassifications`);
  lines.push("");
  const misses = rows.filter((r) => !r.match);
  if (misses.length === 0) {
    lines.push(`_None._`);
  } else {
    lines.push(`| ID | expected | predicted |`);
    lines.push(`|---|---|---|`);
    for (const m of misses) {
      lines.push(`| ${m.id} | ${m.expected} | ${m.predicted} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// ---- system prompts (mirrors of tool prompts; kept here so real-mode uses them) ----

function extractSystemPrompt(): string {
  return `You are a bookkeeping assistant specialized in extracting structured invoice data from email text. Return ONLY a JSON object matching the schema, no commentary.`;
}

function txnClassifySystemPrompt(): string {
  return `You are a bookkeeping assistant that classifies bank/credit card transactions into expense categories. Return ONLY a JSON object with key "classifications" containing one entry per input transaction.`;
}

// ---- main ------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = (args[0] ?? "all") as Subcommand;
  const mode: Mode = args.includes("--real") ? "real" : "mock";

  if (mode === "real" && !process.env["ANTHROPIC_API_KEY"]) {
    console.error("ERROR: --real requires ANTHROPIC_API_KEY in env");
    process.exit(2);
  }

  const outDir = ensureOutputDir();

  if (cmd === "invoice" || cmd === "all") {
    const rows = await runInvoiceBench(mode);
    const report = renderInvoiceReport(rows, mode);
    const path = resolve(outDir, "invoice-extract-accuracy.md");
    writeFileSync(path, report);
    console.log(`wrote ${path}`);
  }

  if (cmd === "txn" || cmd === "all") {
    const rows = await runTxnBench(mode);
    const report = renderTxnReport(rows, mode);
    const path = resolve(outDir, "txn-classify-accuracy.md");
    writeFileSync(path, report);
    console.log(`wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
