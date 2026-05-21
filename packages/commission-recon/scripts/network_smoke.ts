#!/usr/bin/env tsx
import { strict as assert } from "node:assert";
import http from "node:http";
import https from "node:https";

let fetchCalled = false;
let httpCalled = false;

globalThis.fetch = ((...args: unknown[]) => {
  fetchCalled = true;
  throw new Error(`fetch detected: ${JSON.stringify(args)}`);
}) as typeof globalThis.fetch;

(http as { request: typeof http.request }).request = ((..._args: unknown[]) => {
  httpCalled = true;
  throw new Error("http.request");
}) as typeof http.request;

(https as { request: typeof https.request }).request = ((..._args: unknown[]) => {
  httpCalled = true;
  throw new Error("https.request");
}) as typeof https.request;

async function main(): Promise<void> {
  await import("@chadlabs/core");
  const { disputeEmailDraftPrompt } = await import("../src/prompts/dispute_email_draft.js");
  const { carrierFormatsResource } = await import("../src/resources/carrier-formats.js");

  disputeEmailDraftPrompt.render({
    discrepancy_json: JSON.stringify({ policy_number: "POL-1", expected_commission: 100, actual_commission: 80 }),
  });
  const body = await carrierFormatsResource.read();
  assert.ok(body.length > 200);

  assert.equal(fetchCalled, false);
  assert.equal(httpCalled, false);

  console.log("✓ @chadlabs/commission-recon: zero outbound network attempts across prompts + resource");
}

main().catch((e) => { console.error("FAIL:", e); process.exit(1); });
