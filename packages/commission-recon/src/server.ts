import { defineMCPServer } from "@chadlabs/core";
import type { Tool, Prompt, Resource } from "@chadlabs/core";

import { discrepancyLogRecordTool } from "./tools/discrepancy_log_record.js";
import { disputeEmailDraftPrompt } from "./prompts/dispute_email_draft.js";
import { carrierFormatsResource } from "./resources/carrier-formats.js";

export const tools: Tool[] = [discrepancyLogRecordTool as unknown as Tool];
export const prompts: Prompt[] = [disputeEmailDraftPrompt];
export const resources: Resource[] = [carrierFormatsResource];

const server = defineMCPServer({
  name: "commission-recon-mcp",
  version: "0.1.0",
  tools,
  prompts,
  resources,
});

export function serve(): Promise<void> {
  return server.serve();
}
