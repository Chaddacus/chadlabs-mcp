#!/usr/bin/env tsx
/**
 * Network smoke test for claim c6 ("zero outbound LLM calls from the server").
 *
 * Stubs global fetch + http.request + https.request, then imports every
 * server-side module and exercises every Prompt + Resource. Any attempt to
 * make a network call FAILS the test loudly.
 *
 * Run:  pnpm --filter @chadlabs/bookkeeping smoke:network
 */

import { strict as assert } from "node:assert";
import http from "node:http";
import https from "node:https";

let fetchCalled = false;
let httpCalled = false;

const origFetch = globalThis.fetch;
globalThis.fetch = ((...args: unknown[]) => {
  fetchCalled = true;
  throw new Error(`server-side fetch detected: ${JSON.stringify(args)}`);
}) as typeof globalThis.fetch;

(http as { request: typeof http.request }).request = ((..._args: unknown[]) => {
  httpCalled = true;
  throw new Error("server-side http.request detected");
}) as typeof http.request;

(https as { request: typeof https.request }).request = ((..._args: unknown[]) => {
  httpCalled = true;
  throw new Error("server-side https.request detected");
}) as typeof https.request;

async function main(): Promise<void> {
  // Import all public surfaces.
  await import("@chadlabs/core");

  const { invoiceExtractPrompt } = await import("../src/prompts/invoice_extract.js");
  const { txnClassifyPrompt } = await import("../src/prompts/txn_classify.js");
  const { chaseDraftPrompt } = await import("../src/prompts/chase_draft.js");
  const { categoriesResource } = await import("../src/resources/categories.js");

  // Exercise every Prompt — these are pure string templates; no I/O.
  invoiceExtractPrompt.render({
    email_body: "Invoice for $100 from ACME",
    email_from: "billing@acme.com",
    email_subject: "Invoice #1",
  });
  txnClassifyPrompt.render({
    transactions_json: JSON.stringify([
      { id: "t1", date: "2026-05-21", amount: 20, description: "OPENAI USAGE" },
    ]),
  });
  chaseDraftPrompt.render({
    client_json: JSON.stringify({ name: "Sarah", email: "s@x.com" }),
    transactions_json: JSON.stringify([
      { id: "t1", date: "2026-05-21", amount: 50, description: "x", missing: "receipt" },
    ]),
  });

  // Exercise the Resource.
  const body = await categoriesResource.read();
  assert.ok(body.length > 100, "categories resource returned empty");

  // Tools that don't need a DB to instantiate — the server factory wires them.
  // The DB-backed tools (vendor_lookup, vendor_remember, chase_log_record) are
  // covered by the test suite; we don't open a DB here because we're proving
  // *network* locality, not exercising every code path.

  assert.equal(fetchCalled, false, "fetch was called by server code");
  assert.equal(httpCalled, false, "http.request was called by server code");

  console.log("✓ zero outbound network attempts across all prompts and the categories resource");
  console.log("  - global.fetch:        not invoked");
  console.log("  - http.request:        not invoked");
  console.log("  - https.request:       not invoked");
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
