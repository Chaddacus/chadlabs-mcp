#!/usr/bin/env node
/**
 * Cockpit dogfood — end-to-end synthetic workflow proving the bookkeeping
 * cockpit assembles deterministically without a real beta user.
 *
 * Steps:
 *   1. Spin up an isolated SQLite DB under a temp path.
 *   2. Register 4 synthetic clients via client_register.
 *   3. For each client, exercise month_end_status to walk a varying
 *      number of the 15-item canonical checklist.
 *   4. Call client_summary for one client and assert the joined view shape.
 *   5. Render the monthend_narrative prompt with synthetic P&L + variance,
 *      run it through OpenRouter, judge the prose with an LLM-as-judge.
 *   6. Write a markdown report under benchmarks/cockpit-dogfood-<date>.md.
 *
 * Usage:
 *   OPENROUTER_API_KEY=... pnpm --filter @chadlabs/bookkeeping cockpit:dogfood
 *
 * NARRATIVE_ONLY=1 skips the workflow assertions and only runs the prompt eval.
 */

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { clientRegisterTool } from "../src/tools/client_register.js";
import { monthEndStatusTool } from "../src/tools/month_end_status.js";
import { clientSummaryTool } from "../src/tools/client_summary.js";
import { MONTH_END_CHECKLIST } from "../src/cockpit/checklist.js";
import { monthendNarrativePrompt } from "../src/prompts/monthend_narrative.js";

// Reuse the existing OpenRouter provider from the prompt eval harness.
import { openrouterProvider } from "../eval/providers/openrouter.js";
import type { LLMProvider } from "../eval/types.js";

const SYNTHETIC_CLIENTS = [
  { display_name: "Acme Consulting LLC", slug: "acme-consulting", check_through: 15 },
  { display_name: "Northwoods Cafe", slug: "northwoods-cafe", check_through: 10 },
  { display_name: "Pinegrove Property Mgmt", slug: "pinegrove-property", check_through: 5 },
  { display_name: "Helios Solar Co", slug: "helios-solar", check_through: 0 },
];

const PERIOD = "2026-04";

interface JudgeRubricScores {
  cites_specific_numbers: number;
  no_hallucinated_facts: number;
  variance_explained: number;
  clear_asks: number;
  tone_match: number;
  schema_valid: number;
}

const JUDGE_SYSTEM = `You are an experienced practice-owner bookkeeper grading a month-end narrative email an AI assistant drafted for a solo bookkeeper to send to their client.

You will be given:
1. The client info, requested tone, this-period P&L, and prior-period P&L.
2. The open follow-ups list.
3. The assistant's raw JSON output.

Score these 6 dimensions on a 0-5 integer scale (5 = excellent, 3 = acceptable, 0 = absent or wrong):
- cites_specific_numbers: did the email reference the actual revenue, net income, and key expense figures from the input?
- no_hallucinated_facts: did the assistant invent numbers, vendor names, or reasons not present in the input?
- variance_explained: when something moved materially vs prior period, did the email name it (or correctly say "I'd like to confirm with you why X moved")?
- clear_asks: are open follow-ups surfaced as concrete asks the client can act on?
- tone_match: matches the requested tone (warm | plain | executive).
- schema_valid: JSON parses + has subject + body_markdown + body_plain + highlights + questions_for_client + suggested_next_actions.

Return ONLY a JSON object, no preamble, no markdown fences:
{
  "scores": {
    "cites_specific_numbers": 0-5,
    "no_hallucinated_facts": 0-5,
    "variance_explained": 0-5,
    "clear_asks": 0-5,
    "tone_match": 0-5,
    "schema_valid": 0-5
  },
  "critique": "1-3 sentences pointing to the specific text that drove the lowest scores."
}`;

async function runJudge(
  provider: LLMProvider,
  model: string,
  payload: { client: unknown; tone: string; pl: unknown; prior_pl: unknown; followups: unknown; output_raw: string }
): Promise<{ scores: JudgeRubricScores; critique: string }> {
  const userText = [
    `# Client`, "```json", JSON.stringify(payload.client, null, 2), "```", "",
    `# Tone`, payload.tone, "",
    `# This-period P&L`, "```json", JSON.stringify(payload.pl, null, 2), "```", "",
    `# Prior-period P&L`, "```json", JSON.stringify(payload.prior_pl, null, 2), "```", "",
    `# Open follow-ups`, "```json", JSON.stringify(payload.followups, null, 2), "```", "",
    `# Assistant output (raw)`, "```", payload.output_raw, "```",
  ].join("\n");

  const res = await provider.complete({ systemText: JUDGE_SYSTEM, userText, model });
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
    parsed = JSON.parse(candidate.slice(start, end + 1));
  }
  const clamp = (n: unknown) => {
    const x = typeof n === "number" ? Math.round(n) : 0;
    return Math.max(0, Math.min(5, x));
  };
  return {
    scores: {
      cites_specific_numbers: clamp(parsed.scores?.cites_specific_numbers),
      no_hallucinated_facts: clamp(parsed.scores?.no_hallucinated_facts),
      variance_explained: clamp(parsed.scores?.variance_explained),
      clear_asks: clamp(parsed.scores?.clear_asks),
      tone_match: clamp(parsed.scores?.tone_match),
      schema_valid: clamp(parsed.scores?.schema_valid),
    },
    critique: typeof parsed.critique === "string" ? parsed.critique : "",
  };
}

function totalScore(s: JudgeRubricScores): number {
  return (
    s.cites_specific_numbers +
    s.no_hallucinated_facts +
    s.variance_explained +
    s.clear_asks +
    s.tone_match +
    s.schema_valid
  );
}

function parseToolText<T>(res: { content: Array<{ type: string; text?: string }> }): T {
  const text = res.content?.[0]?.text;
  if (!text) throw new Error("tool returned no text content");
  return JSON.parse(text) as T;
}

async function main() {
  // 1. isolated DB
  const tmp = mkdtempSync(join(tmpdir(), "chadlabs-cockpit-dogfood-"));
  const dbPath = join(tmp, "db.sqlite");
  process.env["CHADLABS_BOOKKEEPING_DB"] = dbPath;

  const workflow_steps: string[] = [];
  workflow_steps.push(`DB: ${dbPath}`);

  // 2. register clients
  const registered: Array<{ slug: string; display_name: string; id: string; check_through: number }> = [];
  for (const c of SYNTHETIC_CLIENTS) {
    const res = await clientRegisterTool.handler({
      display_name: c.display_name,
      slug: c.slug,
      notes: `Synthetic dogfood client — created ${new Date().toISOString().slice(0, 10)}`,
    });
    const parsed = parseToolText<{ id: string; action: string }>(res);
    workflow_steps.push(`client_register ${c.slug} → ${parsed.action}`);
    if (parsed.action !== "created") {
      throw new Error(`expected created for fresh DB, got ${parsed.action}`);
    }
    registered.push({ ...c, id: parsed.id });
  }

  // Idempotency check: register one again, expect "updated".
  const idem = await clientRegisterTool.handler({
    display_name: "Acme Consulting LLC (renamed)",
    slug: "acme-consulting",
  });
  const idemParsed = parseToolText<{ action: string }>(idem);
  if (idemParsed.action !== "updated") {
    throw new Error(`expected updated on re-register, got ${idemParsed.action}`);
  }
  workflow_steps.push(`client_register acme-consulting (re-register) → updated ✓`);

  // 3. walk checklist for each client
  for (const c of registered) {
    for (let i = 0; i < c.check_through; i++) {
      const item = MONTH_END_CHECKLIST[i]!;
      await monthEndStatusTool.handler({
        client_slug: c.slug,
        period: PERIOD,
        set: { item_key: item.key, checked: true, notes: `Synthetic check via dogfood for ${c.slug}` },
      });
    }
    const status = await monthEndStatusTool.handler({ client_slug: c.slug, period: PERIOD });
    const parsed = parseToolText<{ completed: number; total: number; percent_complete: number; next_item: string | null; checklist: unknown[] }>(status);
    if (parsed.completed !== c.check_through) {
      throw new Error(`${c.slug}: expected ${c.check_through} completed, got ${parsed.completed}`);
    }
    if (parsed.total !== MONTH_END_CHECKLIST.length) {
      throw new Error(`${c.slug}: expected total ${MONTH_END_CHECKLIST.length}, got ${parsed.total}`);
    }
    workflow_steps.push(
      `month_end_status ${c.slug} ${PERIOD} → ${parsed.completed}/${parsed.total} (${parsed.percent_complete}%) next=${parsed.next_item ?? "—"}`
    );
  }

  // 4. client_summary roster view — should list all 4 synthetic clients.
  const summary = await clientSummaryTool.handler({});
  const summaryParsed = parseToolText<{
    clients: Array<{ slug: string; display_name: string }>;
    client_count: number;
  }>(summary);
  if (summaryParsed.client_count !== registered.length) {
    throw new Error(
      `client_summary: expected ${registered.length} clients, got ${summaryParsed.client_count}`
    );
  }
  const slugs = new Set(summaryParsed.clients.map((c) => c.slug));
  for (const r of registered) {
    if (!slugs.has(r.slug)) throw new Error(`client_summary: missing ${r.slug}`);
  }
  workflow_steps.push(`client_summary roster → ${summaryParsed.client_count} clients (all 4 present) ✓`);

  // 5. monthend_narrative prompt + LLM-as-judge
  if (!openrouterProvider.available()) {
    console.error("OPENROUTER_API_KEY not set — workflow assertions passed but narrative eval skipped");
    console.log("\n--- dogfood workflow steps ---");
    for (const s of workflow_steps) console.log(`  ${s}`);
    process.exit(0);
  }

  const client = { display_name: "Northwoods Cafe", period: PERIOD, accounting_method: "accrual" };
  const pl = { revenue: 84_200, cogs: 31_800, operating_expenses: 41_400, net_income: 11_000, currency: "USD" };
  const prior_pl = { revenue: 76_800, cogs: 30_100, operating_expenses: 38_900, net_income: 7_800, currency: "USD" };
  const followups = [
    { kind: "missing_receipt", txn_memo: "MEMO-1138 $412.50 2026-04-08", waiting_on: "client" },
    { kind: "reclass_proposal", from: "Travel", to: "Marketing", reason: "Meals at vendor lunch billed under Travel" },
  ];

  const rendered = monthendNarrativePrompt.render({
    client_json: JSON.stringify(client),
    pl_summary_json: JSON.stringify(pl),
    prior_period_pl_summary_json: JSON.stringify(prior_pl),
    open_followups_json: JSON.stringify(followups),
    tone: "warm",
  });

  const model = openrouterProvider.defaultModel();
  const judgeModel = process.env["EVAL_JUDGE_MODEL"] ?? "anthropic/claude-sonnet-4.5";
  process.stderr.write(`Running monthend_narrative on ${model} (judged by ${judgeModel})... `);

  const exec = await openrouterProvider.complete({
    systemText: rendered.messages[0]!.content.text,
    userText: rendered.messages[1]!.content.text,
    model,
  });

  const judgement = await runJudge(openrouterProvider, judgeModel, {
    client,
    tone: "warm",
    pl,
    prior_pl,
    followups,
    output_raw: exec.rawText,
  });
  const score = totalScore(judgement.scores);
  process.stderr.write(`done — ${score}/30\n`);

  // 6. write report
  const dir = resolve(process.cwd(), "benchmarks");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const path = resolve(dir, `cockpit-dogfood-${stamp}.md`);
  const md = [
    `# bookkeeping cockpit dogfood — ${stamp}`,
    "",
    `- DB: \`${dbPath}\``,
    `- clients registered: ${registered.length} (idempotent re-register verified)`,
    `- period: ${PERIOD}`,
    `- model: \`${model}\``,
    `- judge: \`${judgeModel}\``,
    `- narrative score: ${score}/30 (pass ≥24)`,
    `- narrative pass: ${score >= 24 ? "✅" : "❌"}`,
    "",
    "## Workflow assertions",
    "",
    ...workflow_steps.map((s) => `- ${s}`),
    "",
    "## Narrative scores",
    "",
    "| dimension | score |",
    "|---|---|",
    `| cites_specific_numbers | ${judgement.scores.cites_specific_numbers} |`,
    `| no_hallucinated_facts | ${judgement.scores.no_hallucinated_facts} |`,
    `| variance_explained | ${judgement.scores.variance_explained} |`,
    `| clear_asks | ${judgement.scores.clear_asks} |`,
    `| tone_match | ${judgement.scores.tone_match} |`,
    `| schema_valid | ${judgement.scores.schema_valid} |`,
    `| **total** | **${score}/30** |`,
    "",
    "## Judge critique",
    "",
    judgement.critique || "(none)",
    "",
    "## Narrative raw output",
    "",
    "```",
    exec.rawText,
    "```",
  ].join("\n");
  writeFileSync(path, md);
  console.log(`wrote ${path}`);

  if (score < 24) {
    console.error(`narrative score ${score}/30 below pass threshold`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
