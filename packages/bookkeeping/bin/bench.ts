#!/usr/bin/env node
/**
 * Prompts-evaluation harness for @chadlabs/bookkeeping.
 *
 * In the host-LLM architecture, the MCP server does NOT call an LLM. The host
 * (Claude Desktop, Goose, Cursor, custom client, local model via Continue,
 * etc.) loads our prompts and runs them against its own model.
 *
 * This harness exists to evaluate the QUALITY of our prompts when sent to a
 * model. It's our internal regression suite for prompt engineering. Users
 * don't need to run it.
 *
 * Usage:
 *   pnpm --filter @chadlabs/bookkeeping bench --render-only
 *     # No LLM calls. Validates prompts render against fixtures.
 *
 *   pnpm --filter @chadlabs/bookkeeping bench --provider=<p> --model=<m>
 *     # Real LLM evaluation. Implemented per-provider as we add benchmarks.
 *
 * v1 ships with --render-only only. Real-LLM evaluation gets wired in once
 * we pick a primary provider for our internal CI eval (likely OpenRouter so
 * we can A/B across models).
 */

import { invoiceExtractPrompt } from "../src/prompts/invoice_extract.js";
import { txnClassifyPrompt } from "../src/prompts/txn_classify.js";
import { chaseDraftPrompt } from "../src/prompts/chase_draft.js";

interface RenderCheck {
  name: string;
  ok: boolean;
  detail: string;
}

function checkInvoicePrompt(): RenderCheck {
  try {
    const out = invoiceExtractPrompt.render({
      email_body: "Test invoice body $100",
      email_from: "billing@test.com",
      email_subject: "Test invoice",
    });
    const ok = out.messages.length === 2 && out.messages[0]!.content.text.length > 100;
    return {
      name: "invoice_extract",
      ok,
      detail: `${out.messages.length} messages, system=${out.messages[0]!.content.text.length}ch, user=${out.messages[1]!.content.text.length}ch`,
    };
  } catch (err) {
    return { name: "invoice_extract", ok: false, detail: String(err) };
  }
}

function checkTxnPrompt(): RenderCheck {
  try {
    const out = txnClassifyPrompt.render({
      transactions_json: JSON.stringify([
        { id: "t1", date: "2026-05-01", amount: 20, description: "OPENAI" },
      ]),
      known_vendors_json: JSON.stringify([
        { name: "OpenAI", default_category: "Software & SaaS" },
      ]),
    });
    const ok =
      out.messages.length === 2 &&
      out.messages[1]!.content.text.includes("Known vendor hints");
    return {
      name: "txn_classify",
      ok,
      detail: `${out.messages.length} messages, includes-vendor-hints=${out.messages[1]!.content.text.includes("Known vendor hints")}`,
    };
  } catch (err) {
    return { name: "txn_classify", ok: false, detail: String(err) };
  }
}

function checkChasePrompt(): RenderCheck {
  try {
    const out = chaseDraftPrompt.render({
      client_json: JSON.stringify({ name: "Sarah", email: "s@x.com" }),
      transactions_json: JSON.stringify([
        { id: "t1", date: "2026-05-01", amount: 50, description: "x", missing: "receipt" },
      ]),
      tone: "firm",
    });
    const ok =
      out.messages.length === 2 &&
      out.messages[1]!.content.text.includes("Tone: firm");
    return {
      name: "chase_draft",
      ok,
      detail: `${out.messages.length} messages, tone-respected=${out.messages[1]!.content.text.includes("Tone: firm")}`,
    };
  } catch (err) {
    return { name: "chase_draft", ok: false, detail: String(err) };
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const provider = args.find((a) => a.startsWith("--provider="))?.split("=")[1];

  if (provider) {
    console.error(
      "Real-LLM evaluation mode is not yet implemented. Run with --render-only to validate prompt rendering."
    );
    process.exit(2);
  }

  const checks: RenderCheck[] = [
    checkInvoicePrompt(),
    checkTxnPrompt(),
    checkChasePrompt(),
  ];

  console.log("# Prompts render check\n");
  for (const c of checks) {
    console.log(`${c.ok ? "✅" : "❌"} ${c.name} — ${c.detail}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll prompts render cleanly. For real-LLM eval (planned): --provider=<p> --model=<m>.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
