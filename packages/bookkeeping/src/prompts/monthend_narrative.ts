import type { Prompt } from "@chadlabs/core";

function systemFor(tone: string | undefined): string {
  const toneInstruction =
    tone === "warm"
      ? "Warm and personable. Like a trusted bookkeeper writing to a client they've known for years."
      : tone === "executive"
      ? "Executive-summary style. Short, declarative, numbers first."
      : "Plain professional. Clear, direct, no jargon unless quoted from the books.";

  return `You are a bookkeeping assistant drafting the month-end narrative email a solo bookkeeper sends to their client.

Tone: ${toneInstruction}

Return ONLY a single JSON object matching this exact schema, no markdown fences, no commentary:

{
  "subject": string,
  "body_markdown": string,
  "body_plain": string,
  "highlights": [{ "label": string, "value_text": string }],
  "questions_for_client": string[],
  "suggested_next_actions": string[]
}

Field rules:
- subject: include the client name and period (e.g. "Acme Inc — May 2026 books"). ≤80 chars.
- body_markdown: 3-6 short paragraphs. Lead with the headline number (net income or burn). Then 2-3 things that changed materially vs prior period. Then a clear "what I need from you" if any. No fabricated explanations — if the data doesn't tell you why something moved, say "I'd like to confirm with you why X moved before close."
- body_plain: same content as body_markdown but with markdown stripped. Suitable for plain-text email.
- highlights: 3-5 numeric callouts the client cares about. Keep value_text human-readable (e.g. "$12,340" not "12340").
- questions_for_client: only include questions you genuinely need answered before closing the books. Empty list is acceptable.
- suggested_next_actions: 1-3 concrete next steps (e.g. "send the new W-9 for Vendor X", "approve the reclass of MEMO-1138 from Travel to Marketing").

Do not invent numbers. Use only what's in the input data. If the data is missing something material, name the gap in questions_for_client.`;
}

export const monthendNarrativePrompt: Prompt = {
  name: "monthend_narrative",
  description:
    "Draft the month-end narrative email a solo bookkeeper sends to a client. Takes the client's P&L summary, prior-period comparison, and any open follow-ups; returns subject + markdown body + plain body + highlights + questions + next actions. The host LLM does the writing; this prompt enforces tone and output structure.",
  arguments: [
    {
      name: "client_json",
      description:
        "JSON with the client info: { display_name, period, accounting_method? }",
      required: true,
    },
    {
      name: "pl_summary_json",
      description:
        "JSON with the period's P&L summary: { revenue: number, cogs?: number, operating_expenses: number, net_income: number, currency }",
      required: true,
    },
    {
      name: "prior_period_pl_summary_json",
      description: "Optional JSON of the prior period's P&L with the same shape, for variance analysis.",
      required: false,
    },
    {
      name: "open_followups_json",
      description:
        "Optional JSON array of open follow-ups: missing receipts, unanswered chase emails, reclass proposals.",
      required: false,
    },
    {
      name: "tone",
      description: "warm | plain | executive (default: plain)",
      required: false,
    },
  ],
  render(args) {
    const userLines: string[] = [];
    userLines.push(`Client: ${args["client_json"]}`);
    userLines.push(`P&L (this period): ${args["pl_summary_json"]}`);
    if (args["prior_period_pl_summary_json"]) {
      userLines.push(`P&L (prior period): ${args["prior_period_pl_summary_json"]}`);
    }
    if (args["open_followups_json"]) {
      userLines.push(`Open follow-ups: ${args["open_followups_json"]}`);
    }
    return {
      messages: [
        { role: "user", content: { type: "text", text: systemFor(args["tone"]) } },
        { role: "user", content: { type: "text", text: userLines.join("\n\n") } },
      ],
    };
  },
};

export const MONTHEND_NARRATIVE_SYSTEM = systemFor(undefined);
