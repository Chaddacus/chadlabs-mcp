#!/usr/bin/env node
/**
 * Cross-host eval for @chadlabs/commission-recon.
 *
 * Single prompt evaluated: dispute_email_draft.
 * Prose output → LLM-as-judge against fixture-specific rubrics.
 *
 * Usage:
 *   pnpm --filter @chadlabs/commission-recon eval openrouter
 *   pnpm --filter @chadlabs/commission-recon eval openrouter anthropic/claude-sonnet-4.5
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { disputeEmailDraftPrompt } from "../src/prompts/dispute_email_draft.js";
import { DISPUTE_FIXTURES } from "../eval/fixtures.js";
import { openrouterProvider } from "../eval/providers/openrouter.js";
import { runJudge, totalScore } from "../eval/judge.js";
import type { LLMProvider, DisputeScoreRow } from "../eval/types.js";

const PROVIDERS: Record<string, LLMProvider> = {
  openrouter: openrouterProvider,
};

function outputDir(): string {
  const dir = resolve(process.cwd(), "benchmarks");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function runDispute(provider: LLMProvider, model: string, judgeModel: string) {
  const rows: DisputeScoreRow[] = [];
  let totalLatency = 0;
  const errors: string[] = [];

  for (const f of DISPUTE_FIXTURES) {
    let raw_output = "";
    try {
      const rendered = disputeEmailDraftPrompt.render({
        discrepancy_json: JSON.stringify(f.discrepancy),
        tone: f.tone,
        ...(f.policy_history
          ? { policy_history_json: JSON.stringify(f.policy_history) }
          : {}),
      });
      const resp = await provider.complete({
        systemText: rendered.messages[0]!.content.text,
        userText: rendered.messages[1]!.content.text,
        model,
      });
      totalLatency += resp.latencyMs;
      raw_output = resp.rawText;
    } catch (err) {
      errors.push(`${f.id} (executor): ${err}`);
      rows.push({
        fixture_id: f.id,
        raw_output: "",
        scores: null,
        judge_critique: "",
        total_score: 0,
        pass: false,
        parse_error: String(err).slice(0, 160),
      });
      continue;
    }

    try {
      const judgement = await runJudge(provider, judgeModel, {
        discrepancy: f.discrepancy,
        tone: f.tone,
        policy_history: f.policy_history,
        rubric: f.rubric,
        output_raw: raw_output,
      });
      const score = totalScore(judgement.scores);
      rows.push({
        fixture_id: f.id,
        raw_output,
        scores: judgement.scores,
        judge_critique: judgement.critique,
        total_score: score,
        pass: score >= 24,
      });
    } catch (err) {
      errors.push(`${f.id} (judge): ${err}`);
      rows.push({
        fixture_id: f.id,
        raw_output,
        scores: null,
        judge_critique: "",
        total_score: 0,
        pass: false,
        judge_error: String(err).slice(0, 160),
      });
    }
  }
  return { rows, totalLatency, errors };
}

function renderReport(
  provider: string,
  model: string,
  judgeModel: string,
  rows: DisputeScoreRow[],
  totalLatency: number,
  errors: string[]
): string {
  const n = rows.length;
  const passed = rows.filter((r) => r.pass).length;
  const meanScore =
    rows.reduce((a, r) => a + r.total_score, 0) / Math.max(1, n);
  const lines: string[] = [];
  lines.push(`# dispute_email_draft — ${provider} / \`${model}\``);
  lines.push("");
  lines.push(`- fixtures: ${n}`);
  lines.push(`- judge model: \`${judgeModel}\``);
  lines.push(`- pass rate (≥24/30 = 80%): ${passed}/${n} (${((passed / n) * 100).toFixed(1)}%)`);
  lines.push(`- mean total score: ${meanScore.toFixed(1)}/30`);
  lines.push(`- total executor latency: ${(totalLatency / 1000).toFixed(2)}s`);
  if (errors.length) lines.push(`- errors: ${errors.length}`);
  lines.push("");
  lines.push("## Per-fixture scores");
  lines.push("");
  lines.push("| Fixture | nums | no-halluc | ask | tone | prof | schema | total | pass |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const s = r.scores;
    if (!s) {
      lines.push(`| ${r.fixture_id} | — | — | — | — | — | — | 0 | ❌ (${r.parse_error || r.judge_error || "error"}) |`);
    } else {
      lines.push(
        `| ${r.fixture_id} | ${s.cites_specific_numbers} | ${s.no_hallucinated_facts} | ${s.clear_ask} | ${s.tone_match} | ${s.professional_tone} | ${s.schema_valid} | ${r.total_score} | ${r.pass ? "✅" : "❌"} |`
      );
    }
  }
  lines.push("");
  const failures = rows.filter((r) => !r.pass);
  if (failures.length) {
    lines.push("## Failure critiques");
    lines.push("");
    for (const r of failures) {
      lines.push(`### ${r.fixture_id} — ${r.total_score}/30`);
      lines.push(r.judge_critique || r.parse_error || r.judge_error || "(no critique)");
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const providerArg = args[0] ?? "openrouter";
  const modelArg = args[1];

  const provider = PROVIDERS[providerArg];
  if (!provider) {
    console.error(`unknown provider ${providerArg}`);
    process.exit(2);
  }
  if (!provider.available()) {
    console.error(`provider ${providerArg} not configured (set its API key env)`);
    process.exit(2);
  }

  const model = modelArg ?? provider.defaultModel();
  const judgeModel = process.env["EVAL_JUDGE_MODEL"] ?? "anthropic/claude-sonnet-4.5";

  const dir = outputDir();
  const stamp = new Date().toISOString().slice(0, 10);

  process.stderr.write(`Running dispute_email_draft on ${provider.id} / ${model} (judged by ${judgeModel})... `);
  const { rows, totalLatency, errors } = await runDispute(provider, model, judgeModel);
  process.stderr.write(`done in ${(totalLatency / 1000).toFixed(1)}s\n`);

  const md = renderReport(provider.id, model, judgeModel, rows, totalLatency, errors);
  const path = resolve(dir, `dispute-email-${provider.id}-${stamp}.md`);
  writeFileSync(path, md);
  console.log(`wrote ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
