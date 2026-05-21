import type { Prompt } from "@chadlabs/core";

function systemFor(tone: string | undefined, reasonCodesMarkdown: string | undefined): string {
  const toneInstruction =
    tone === "legal"
      ? "Formal legal tone. Cite ERISA / state insurance code provisions where appropriate. Number paragraphs."
      : tone === "friendly"
      ? "Friendly but firm. Like a knowledgeable patient advocate writing to the payer."
      : "Clinical professional. Provider-to-payer, medical specifics first.";

  const codeBlock = reasonCodesMarkdown
    ? `\n\nREASON CODES — cite at least one of these codes verbatim when explaining why the denial was wrong:\n\n${reasonCodesMarkdown}\n`
    : `\n\nFor reason codes, use the chart loaded as MCP resource "prior-auth://reason-codes". If the host has not injected it, cite the denial language directly without a code reference.\n`;

  return `You are a clinical/admin assistant drafting an appeal letter to a US health insurance payer for a denied prior authorization or claim.

Tone: ${toneInstruction}

You are NOT a medical advisor. You produce a TEMPLATE for the human (clinician, billing manager, or patient advocate) to review, edit, and submit. The output must:
- Quote the specific denial language from the denial input.
- Cite at least one denial reason code from the chart when applicable.
- State the medical necessity argument concisely with clinical facts pulled from the input.
- Request a specific remedy (overturn the denial, schedule a peer-to-peer, escalate to external review).
- NOT invent diagnoses, treatment outcomes, or member details not in the input.

Return ONLY a single JSON object matching this exact schema, no markdown fences, no commentary:

{
  "subject": string,
  "body_markdown": string,
  "body_plain": string,
  "suggested_attachments": string[],
  "cited_codes": string[]
}

Field rules:
- subject: include member ID, date of service, and "appeal" — ≤120 chars.
- body_markdown: 4–8 short paragraphs. Markdown OK.
- body_plain: same content, markdown stripped. Suitable for fax/email/portal text fields.
- suggested_attachments: documents the appellant should attach (e.g. "Original denial letter", "Clinical notes from date of service", "Peer-reviewed citation supporting indication").
- cited_codes: the reason codes you cited from the chart (empty array if none cited).${codeBlock}`;
}

export const appealLetterDraftPrompt: Prompt = {
  name: "appeal_letter_draft",
  description:
    "Draft an appeal letter for a denied prior auth or claim. The host LLM does the writing using your model credentials; this prompt enforces output structure and tone. Pass reason_codes_markdown (or fetch the prior-auth://reason-codes resource) to constrain citations to the canonical taxonomy.",
  arguments: [
    {
      name: "denial_json",
      description: "JSON of the denial: { payer, claim_id, member_id, denial_reason_code?, denial_reason_text, raw_excerpt, date_of_service }",
      required: true,
    },
    {
      name: "clinical_facts_json",
      description: "JSON of relevant clinical facts: { diagnosis_codes[], prior_treatments_tried[], clinical_summary, supporting_citations[] }",
      required: true,
    },
    {
      name: "tone",
      description: "friendly | clinical | legal (default: clinical)",
      required: false,
    },
    {
      name: "payer_appeal_address_json",
      description: "JSON of the payer's appeal mailing/portal address: { recipient, address_lines[], fax?, portal_url? }",
      required: false,
    },
    {
      name: "reason_codes_markdown",
      description: "Body of the prior-auth://reason-codes resource. When provided, the prompt constrains cited_codes to those exact codes.",
      required: false,
    },
  ],
  render(args) {
    const userLines: string[] = [];
    userLines.push(`Denial: ${args["denial_json"]}`);
    userLines.push(`Clinical facts: ${args["clinical_facts_json"]}`);
    if (args["payer_appeal_address_json"]) {
      userLines.push(`Payer appeal address: ${args["payer_appeal_address_json"]}`);
    }
    return {
      messages: [
        {
          role: "user",
          content: { type: "text", text: systemFor(args["tone"], args["reason_codes_markdown"]) },
        },
        { role: "user", content: { type: "text", text: userLines.join("\n\n") } },
      ],
    };
  },
};

export const APPEAL_LETTER_DRAFT_SYSTEM = systemFor(undefined, undefined);
