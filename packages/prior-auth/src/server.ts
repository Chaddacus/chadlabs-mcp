import { defineMCPServer } from "@chadlabs/core";
import type { Tool, Prompt, Resource } from "@chadlabs/core";

import { slaClockCheckTool } from "./tools/sla_clock_check.js";
import { appealLogRecordTool } from "./tools/appeal_log_record.js";
import { denialReasonExtractTool } from "./tools/denial_reason_extract.js";

import { appealLetterDraftPrompt } from "./prompts/appeal_letter_draft.js";
import { denialClassifyPrompt } from "./prompts/denial_classify.js";

import { reasonCodesResource } from "./resources/reason-codes.js";

export const tools: Tool[] = [
  slaClockCheckTool as unknown as Tool,
  appealLogRecordTool as unknown as Tool,
  denialReasonExtractTool as unknown as Tool,
];

export const prompts: Prompt[] = [appealLetterDraftPrompt, denialClassifyPrompt];

export const resources: Resource[] = [reasonCodesResource];

const server = defineMCPServer({
  name: "prior-auth-mcp",
  version: "0.1.0",
  tools,
  prompts,
  resources,
});

export function serve(): Promise<void> {
  return server.serve();
}
