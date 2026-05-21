import type { Prompt } from "@chadlabs/core";

function systemFor(reasonCodesMarkdown: string | undefined): string {
  const codeBlock = reasonCodesMarkdown
    ? `\n\nREASON CODES — pick denial_reason_code from EXACTLY one of these codes (the leftmost identifier). Match casing verbatim. Use UNK-001 if nothing fits.\n\n${reasonCodesMarkdown}\n`
    : `\n\nFor denial_reason_code, use the chart loaded as MCP resource "prior-auth://reason-codes". If the host has not injected it, return "UNK-001" with confidence ≤ 0.4 and explain in rationale.\n`;

  return `You are a denial-reason classifier. Given free-text denial language from a payer EOB or denial letter, return the structured reason code.

Return ONLY a single JSON object matching this schema, no markdown fences, no commentary:

{
  "denial_reason_code": string,
  "denial_reason_label": string,
  "confidence": number,
  "alternative_codes": string[],
  "rationale": string
}

Field rules:
- denial_reason_code: exact code from the chart (e.g. "MN-001"). Copy the leftmost identifier verbatim character-by-character. Do NOT abbreviate, expand, normalize, or translate the prefix (e.g. if the chart lists "FORM-001", do not output "FRM-001"; if the chart lists "FRM-001", do not output "FORM-001"). The prefix you return must exist somewhere in the chart text.
- denial_reason_label: the human-readable label corresponding to that code.
- confidence: 0.0 to 1.0 — your honest read of whether the language clearly maps to this code.
- alternative_codes: up to 3 other codes you considered but rejected, ranked by likelihood.
- rationale: one sentence pointing to the specific words in the denial that drove the choice.${codeBlock}`;
}

export const denialClassifyPrompt: Prompt = {
  name: "denial_classify",
  description:
    "Classify free-text denial language into a structured reason code. Inject the prior-auth://reason-codes resource via reason_codes_markdown to constrain output to the canonical taxonomy.",
  arguments: [
    {
      name: "denial_text",
      description: "Free-text denial reason language as it appears on the EOB or denial letter.",
      required: true,
    },
    {
      name: "reason_codes_markdown",
      description: "Body of the prior-auth://reason-codes resource. When provided, constrains denial_reason_code to the canonical list.",
      required: false,
    },
  ],
  render(args) {
    return {
      messages: [
        {
          role: "user",
          content: { type: "text", text: systemFor(args["reason_codes_markdown"]) },
        },
        {
          role: "user",
          content: { type: "text", text: `Denial text:\n${args["denial_text"] ?? ""}` },
        },
      ],
    };
  },
};

export const DENIAL_CLASSIFY_SYSTEM = systemFor(undefined);
