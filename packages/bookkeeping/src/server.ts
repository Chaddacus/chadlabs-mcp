import { defineMCPServer } from "@chadlabs/core";
import type { Tool } from "./__core_shim__.js";
import { invoiceExtractTool } from "./tools/invoice_extract.js";
import { txnClassifyTool } from "./tools/txn_classify.js";
import { chaseDraftTool } from "./tools/chase_draft.js";

// Tools are invariant in their input-type generic; coerce to Tool<unknown> at
// the boundary so defineMCPServer accepts the heterogeneous array.
export const tools: Tool[] = [
  invoiceExtractTool as unknown as Tool,
  txnClassifyTool as unknown as Tool,
  chaseDraftTool as unknown as Tool,
];

const server = defineMCPServer({
  name: "bookkeeping-mcp",
  version: "0.0.0",
  tools,
});

export function serve(): Promise<void> {
  return server.serve();
}
