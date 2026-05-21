#!/usr/bin/env node
/**
 * Cross-host eval for @chadlabs/prior-auth.
 *
 * Two prompts evaluated:
 *  - denial_classify: deterministic top-1 reason-code match.
 *  - appeal_letter_draft: LLM-as-judge against fixture-specific rubric.
 *
 * Usage:
 *   pnpm --filter @chadlabs/prior-auth eval classify openrouter
 *   pnpm --filter @chadlabs/prior-auth eval appeal openrouter
 *   pnpm --filter @chadlabs/prior-auth eval both openrouter
 *
 * Judge defaults to OpenRouter / claude-sonnet-4.5 unless overridden via
 * EVAL_JUDGE_MODEL.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { denialClassifyPrompt } from "../src/prompts/denial_classify.js";
import { appealLetterDraftPrompt } from "../src/prompts/appeal_letter_draft.js";
import { REASON_CODES_MARKDOWN } from "../src/resources/reason-codes.js";
import { CLASSIFY_FIXTURES, APPEAL_FIXTURES } from "../eval/fixtures.js";
import { openrouterProvider } from "../eval/providers/openrouter.js";
import { scoreClassify } from "../eval/scorer.js";
import { runJudge, totalScore } from "../eval/judge.js";
import type { LLMProvider, AppealScoreRow, ClassifyScoreRow } from "../eval/types.js";

const PROVIDERS: Record<string, LLMProvider> = {
  openrouter: openrouterProvider,
};

function outputDir(): string {
  const dir = resolve(process.cwd(), "benchmarks");
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function runClassify(provider: LLMProvider, model: string) {
  const rows: ClassifyScoreRow[] = [];
  let totalLatency = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const errors: string[] = [];

  for (const f of CLASSIFY_FIXTURES) {
    try {
      const rendered = denialClassifyPrompt.render({
        denial_text: f.denial_text,
        reason_codes_markdown: REASON_CODES_MARKDOWN,
      });
      const resp = await provider.complete({
        systemText: rendered.messages[0]!.content.text,
        userText: rendered.messages[1]!.content.text,
        model,
      });
      totalLatency += resp.latencyMs;
      inputTokens += resp.inputTokens ?? 0;
      outputTokens += resp.outputTokens ?? 0;
      rows.push(scoreClassify(f, resp.rawText));
    } catch (err) {
      errors.push(`${f.id}: ${err}`);
      rows.push({
        fixture_id: f.id,
        expected: f.expected_reason_code,
        predicted: "(provider_error)",
        exact_match: false,
        alt_match: false,
        parse_error: String(err).slice(0, 160),
      });
    }
  }
  return { rows, totalLatency, inputTokens, outputTokens, errors };
}

async function runAppeal(provider: LLMProvider, model: string, judgeModel: string) {
  const rows: AppealScoreRow[] = [];
  let totalLatency = 0;
  const errors: string[] = [];

  for (const f of APPEAL_FIXTURES) {
    let raw_output = "";
    try {
      const rendered = appealLetterDraftPrompt.render({
        denial_json: JSON.stringify(f.denial),
        clinical_facts_json: JSON.stringify(f.clinical_facts),
        reason_codes_markdown: REASON_CODES_MARKDOWN,
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

    // Judge
    try {
      const judgement = await runJudge(provider, judgeModel, {
        denial: f.denial,
        clinical_facts: f.clinical_facts,
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
        pass: score >= 24, // 80% of 30
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

function renderClassifyReport(
  provider: string,
  model: string,
  rows: ClassifyScoreRow[],
  totalLatency: number,
  inputTokens: number,
  outputTokens: number,
  errors: string[]
): string {
  const n = rows.length;
  const exact = rows.filter((r) => r.exact_match).length;
  const alt = rows.filter((r) => r.alt_match).length;
  const lines: string[] = [];
  lines.push(`# denial_classify — ${provider} / \`${model}\``);
  lines.push("");
  lines.push(`- fixtures: ${n}`);
  lines.push(`- exact-match: ${exact} (${((exact / n) * 100).toFixed(1)}%)`);
  lines.push(`- alt-match (acceptable alternative): ${alt}`);
  lines.push(`- effective accuracy: ${(((exact + alt) / n) * 100).toFixed(1)}%`);
  lines.push(`- total latency: ${(totalLatency / 1000).toFixed(2)}s`);
  lines.push(`- tokens: in=${inputTokens} out=${outputTokens}`);
  lines.push(`- threshold: 85% exact, pass: ${exact / n >= 0.85 ? "✅" : "❌"}`);
  if (errors.length) lines.push(`- errors: ${errors.length}`);
  lines.push("");
  lines.push("| Fixture | expected | predicted | match |");
  lines.push("|---|---|---|---|");
  for (const r of rows) {
    const m = r.exact_match ? "✅" : r.alt_match ? "🟨 (alt)" : "❌";
    lines.push(`| ${r.fixture_id} | ${r.expected} | ${r.predicted} | ${m} |`);
  }
  return lines.join("\n");
}

function renderAppealReport(
  provider: string,
  model: string,
  judgeModel: string,
  rows: AppealScoreRow[],
  totalLatency: number,
  errors: string[]
): string {
  const n = rows.length;
  const passed = rows.filter((r) => r.pass).length;
  const meanScore =
    rows.filter((r) => r.scores).reduce((a, r) => a + r.total_score, 0) / Math.max(1, rows.length);
  const lines: string[] = [];
  lines.push(`# appeal_letter_draft — ${provider} / \`${model}\``);
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
  lines.push("| Fixture | cite | spec | no-halluc | remedy | tone | schema | total | pass |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const s = r.scores;
    if (!s) {
      lines.push(`| ${r.fixture_id} | — | — | — | — | — | — | 0 | ❌ (${r.parse_error || r.judge_error || "error"}) |`);
    } else {
      lines.push(
        `| ${r.fixture_id} | ${s.cites_real_reason_code} | ${s.specific_not_generic} | ${s.no_hallucinated_facts} | ${s.clear_remedy_requested} | ${s.professional_tone} | ${s.schema_valid} | ${r.total_score} | ${r.pass ? "✅" : "❌"} |`
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
  const promptArg = (args[0] ?? "both") as "classify" | "appeal" | "both";
  const providerArg = args[1] ?? "openrouter";
  const modelArg = args[2];

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
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);

  if (promptArg === "classify" || promptArg === "both") {
    process.stderr.write(`Running denial_classify on ${provider.id} / ${model}... `);
    const { rows, totalLatency, inputTokens, outputTokens, errors } = await runClassify(provider, model);
    process.stderr.write(`done in ${(totalLatency / 1000).toFixed(1)}s\n`);
    const md = renderClassifyReport(provider.id, model, rows, totalLatency, inputTokens, outputTokens, errors);
    const path = resolve(dir, `denial-classify-${provider.id}-${stamp}.md`);
    writeFileSync(path, md);
    console.log(`wrote ${path}`);
  }

  if (promptArg === "appeal" || promptArg === "both") {
    process.stderr.write(`Running appeal_letter_draft on ${provider.id} / ${model} (judged by ${judgeModel})... `);
    const { rows, totalLatency, errors } = await runAppeal(provider, model, judgeModel);
    process.stderr.write(`done in ${(totalLatency / 1000).toFixed(1)}s\n`);
    const md = renderAppealReport(provider.id, model, judgeModel, rows, totalLatency, errors);
    const path = resolve(dir, `appeal-letter-${provider.id}-${stamp}.md`);
    writeFileSync(path, md);
    console.log(`wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
