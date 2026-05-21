import { defineMCPServer } from "@chadlabs/core";
import type { Tool, Prompt, Resource } from "./__core_shim__.js";

import { invoiceExtractPrompt } from "./prompts/invoice_extract.js";
import { txnClassifyPrompt } from "./prompts/txn_classify.js";
import { chaseDraftPrompt } from "./prompts/chase_draft.js";

import { categoriesResource } from "./resources/categories.js";

import { vendorLookupTool } from "./tools/vendor_lookup.js";
import { vendorRememberTool } from "./tools/vendor_remember.js";
import { chaseLogRecordTool } from "./tools/chase_log_record.js";

// Tools are invariant in their input-type generic; coerce at the boundary so
// defineMCPServer accepts the heterogeneous array.
export const tools: Tool[] = [
  vendorLookupTool as unknown as Tool,
  vendorRememberTool as unknown as Tool,
  chaseLogRecordTool as unknown as Tool,
];

export const prompts: Prompt[] = [
  invoiceExtractPrompt,
  txnClassifyPrompt,
  chaseDraftPrompt,
];

export const resources: Resource[] = [categoriesResource];

const server = defineMCPServer({
  name: "bookkeeping-mcp",
  version: "0.0.0",
  tools,
  prompts,
  resources,
});

export function serve(): Promise<void> {
  return server.serve();
}
