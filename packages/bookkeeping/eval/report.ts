import type {
  ProviderRunSummary,
  InvoiceScoreRow,
  TxnScoreRow,
} from "./types.js";

function pct(num: number, denom: number): string {
  if (denom === 0) return "n/a";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function passEmoji(rate: number, threshold: number): string {
  return rate >= threshold ? "✅" : "❌";
}

export function renderInvoiceReport(summary: ProviderRunSummary): string {
  const rows = summary.rows as InvoiceScoreRow[];
  const n = rows.length;
  const vendor = rows.filter((r) => r.vendor_match).length;
  const amount = rows.filter((r) => r.amount_match).length;
  const currency = rows.filter((r) => r.currency_match).length;
  const category = rows.filter((r) => r.category_match).length;

  const lines: string[] = [];
  lines.push(`## ${summary.provider_name} — \`${summary.model}\``);
  lines.push("");
  lines.push(`- prompt: \`invoice_extract\``);
  lines.push(`- corpus: ${n} fixtures`);
  lines.push(`- total latency: ${(summary.total_latency_ms / 1000).toFixed(2)}s`);
  if (summary.total_input_tokens !== null) {
    lines.push(
      `- tokens: in=${summary.total_input_tokens} out=${summary.total_output_tokens ?? 0}`
    );
  }
  if (summary.errors.length > 0) {
    lines.push(`- errors: ${summary.errors.length}`);
  }
  lines.push("");
  lines.push("| Field | Hits | Total | Accuracy | Threshold | Pass |");
  lines.push("|---|---|---|---|---|---|");
  lines.push(
    `| vendor.normalized_name | ${vendor} | ${n} | ${pct(vendor, n)} | 85% | ${passEmoji(vendor / n, 0.85)} |`
  );
  lines.push(
    `| amount_total | ${amount} | ${n} | ${pct(amount, n)} | 95% | ${passEmoji(amount / n, 0.95)} |`
  );
  lines.push(
    `| currency | ${currency} | ${n} | ${pct(currency, n)} | 95% | ${passEmoji(currency / n, 0.95)} |`
  );
  lines.push(
    `| suggested_category | ${category} | ${n} | ${pct(category, n)} | 80% | ${passEmoji(category / n, 0.8)} |`
  );
  lines.push("");
  const failures = rows.filter(
    (r) => !r.vendor_match || !r.amount_match || !r.currency_match || !r.category_match
  );
  if (failures.length > 0) {
    lines.push("### Failures");
    lines.push("");
    lines.push("| Fixture | vendor | amount | currency | category | notes |");
    lines.push("|---|---|---|---|---|---|");
    for (const r of failures) {
      lines.push(
        `| ${r.fixture_id} | ${r.vendor_match ? "✓" : "✗"} | ${r.amount_match ? "✓" : "✗"} | ${r.currency_match ? "✓" : "✗"} | ${r.category_match ? "✓" : "✗"} | ${r.notes || ""} |`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderTxnReport(summary: ProviderRunSummary): string {
  const rows = summary.rows as TxnScoreRow[];
  const n = rows.length;
  const hits = rows.filter((r) => r.match).length;

  const lines: string[] = [];
  lines.push(`## ${summary.provider_name} — \`${summary.model}\``);
  lines.push("");
  lines.push(`- prompt: \`txn_classify\``);
  lines.push(`- corpus: ${n} fixtures (single batched request)`);
  lines.push(`- total latency: ${(summary.total_latency_ms / 1000).toFixed(2)}s`);
  if (summary.total_input_tokens !== null) {
    lines.push(
      `- tokens: in=${summary.total_input_tokens} out=${summary.total_output_tokens ?? 0}`
    );
  }
  if (summary.errors.length > 0) {
    lines.push(`- errors: ${summary.errors.length}`);
  }
  lines.push("");
  lines.push("| Hits | Total | Accuracy | Threshold | Pass |");
  lines.push("|---|---|---|---|---|");
  lines.push(`| ${hits} | ${n} | ${pct(hits, n)} | 85% | ${passEmoji(hits / n, 0.85)} |`);
  lines.push("");
  const misses = rows.filter((r) => !r.match);
  if (misses.length > 0) {
    lines.push("### Misclassifications");
    lines.push("");
    lines.push("| Fixture | expected | predicted |");
    lines.push("|---|---|---|");
    for (const m of misses) {
      lines.push(`| ${m.fixture_id} | ${m.expected} | ${m.predicted} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderTopMatter(
  promptId: string,
  generatedAt: Date,
  providers: ProviderRunSummary[]
): string {
  const lines: string[] = [];
  lines.push(`# ${promptId} — cross-host evaluation`);
  lines.push("");
  lines.push(`- generated: ${generatedAt.toISOString()}`);
  lines.push(`- providers run: ${providers.map((p) => p.provider_id).join(", ")}`);
  lines.push("");
  return lines.join("\n");
}
