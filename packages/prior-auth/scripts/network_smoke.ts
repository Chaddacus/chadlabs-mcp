#!/usr/bin/env tsx
/**
 * Network-locality smoke test for @chadlabs/prior-auth.
 * Stubs fetch + http.request + https.request to throw on call, then imports
 * every server module and exercises every Prompt + Resource. Any network
 * attempt fails the test.
 */
import { strict as assert } from "node:assert";
import http from "node:http";
import https from "node:https";

let fetchCalled = false;
let httpCalled = false;

globalThis.fetch = ((...args: unknown[]) => {
  fetchCalled = true;
  throw new Error(`server-side fetch detected: ${JSON.stringify(args)}`);
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
  const { appealLetterDraftPrompt } = await import("../src/prompts/appeal_letter_draft.js");
  const { denialClassifyPrompt } = await import("../src/prompts/denial_classify.js");
  const { reasonCodesResource } = await import("../src/resources/reason-codes.js");

  appealLetterDraftPrompt.render({
    denial_json: JSON.stringify({ payer: "aetna", denial_reason_text: "x" }),
    clinical_facts_json: JSON.stringify({ diagnosis_codes: [] }),
  });
  denialClassifyPrompt.render({ denial_text: "x" });
  const body = await reasonCodesResource.read();
  assert.ok(body.length > 100);

  assert.equal(fetchCalled, false, "fetch was called by server code");
  assert.equal(httpCalled, false, "http.request was called by server code");

  console.log("✓ @chadlabs/prior-auth: zero outbound network attempts across prompts + resource");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
