import type { Prompt } from "@chadlabs/core";

function systemFor(tone: string | undefined): string {
  const toneInstruction =
    tone === "firm"
      ? "Firm and direct. Cite specific dollar amounts, policy numbers, and statement periods. Request a written response within 10 business days."
      : "Friendly but specific. Polite opener, then the discrepancy details, then a clear ask.";

  return `You are drafting an email from an independent insurance broker to a carrier's producer-services / commission-accounting team about a commission discrepancy.

Tone: ${toneInstruction}

Return ONLY a single JSON object matching this schema, no markdown fences, no commentary:

{
  "subject": string,
  "body_markdown": string,
  "body_plain": string,
  "attachments_suggested": string[]
}

Field rules:
- subject: must include the policy number AND the statement period (e.g. "Commission discrepancy — Policy POL-12345 — May 2026 statement"). ≤120 chars.
- body_markdown: 3–5 short paragraphs. Lead with the specific $ amount + delta. Reference the policy, statement period, and the carrier's own rate schedule if known. End with a specific ask (re-issue payment / send corrected statement / schedule a call).
- body_plain: same content, markdown stripped.
- attachments_suggested: 1–3 specific documents to attach (e.g. "Original carrier statement PDF", "Producer agreement page showing rate", "Prior month statement showing baseline").

Do not invent dollar amounts, policy numbers, or rates. Use only what's in the discrepancy input.`;
}

export const disputeEmailDraftPrompt: Prompt = {
  name: "dispute_email_draft",
  description:
    "Draft a commission-discrepancy dispute email to a carrier. The host LLM writes; this prompt enforces structure and ensures the email is specific (policy number, period, dollar delta) rather than generic.",
  arguments: [
    { name: "discrepancy_json", description: "JSON of the discrepancy: { policy_number, carrier, statement_period, expected_commission, actual_commission, status, notes? }", required: true },
    { name: "tone", description: "friendly | firm (default: friendly)", required: false },
    { name: "policy_history_json", description: "Optional JSON of prior outcomes with this carrier for context.", required: false },
  ],
  render(args) {
    const userLines: string[] = [];
    userLines.push(`Discrepancy: ${args["discrepancy_json"]}`);
    if (args["policy_history_json"]) {
      userLines.push(`Prior history with this carrier: ${args["policy_history_json"]}`);
    }
    return {
      messages: [
        { role: "user", content: { type: "text", text: systemFor(args["tone"]) } },
        { role: "user", content: { type: "text", text: userLines.join("\n\n") } },
      ],
    };
  },
};

export const DISPUTE_EMAIL_DRAFT_SYSTEM = systemFor(undefined);
