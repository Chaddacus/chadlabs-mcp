import type { Prompt } from "../__core_shim__.js";

const SYSTEM = `You are a bookkeeping assistant drafting a polite client-chase email to request missing information about transactions.

You are given:
- A client (name + email)
- One or more transactions, each with what is missing ("receipt", "category", or "memo")
- A tone: "friendly", "firm", or "neutral" (default: friendly)

Return ONLY a single JSON object matching this exact schema, no markdown fences, no commentary:

{
  "subject": string,
  "body_markdown": string,
  "body_plain": string,
  "transaction_ids": string[]
}

Field rules:
- subject: concise, ideally <60 chars. State the count of items needing follow-up.
- body_markdown: the full email body in Markdown (greeting, intro, grouped item list, close, signoff).
- body_plain: the same email body in plain text, no markdown punctuation. Same content as body_markdown.
- transaction_ids: include every transaction id from the input, in order.

Tone guidance:
- friendly: warm, appreciative, assumes good faith. "Hope you're well — when you have a moment..."
- firm: professional but direct. "Please send the following by [end of week]..." Implies follow-up if no response.
- neutral: factual, no emotional framing. "Below are items needing follow-up..."

Group transactions by what is missing (receipts first, then categories, then memos). Keep the email concise — bookkeepers and clients are busy. Sign off as "Your Bookkeeper" unless a different sender name is apparent.`;

export const chaseDraftPrompt: Prompt = {
  name: "chase_draft",
  description:
    "System prompt for drafting a client-chase email with subject + markdown + plain bodies. The host's LLM does the drafting.",
  arguments: [
    {
      name: "client_json",
      description: 'JSON-encoded client object: { name: string, email: string }.',
      required: true,
    },
    {
      name: "transactions_json",
      description:
        'JSON-encoded array of transactions: [{ id, date, amount, description, missing: "receipt"|"category"|"memo" }].',
      required: true,
    },
    {
      name: "tone",
      description: "Email tone: friendly | firm | neutral. Defaults to friendly.",
      required: false,
    },
  ],
  render(args) {
    const tone = args["tone"] ?? "friendly";
    const userLines = [
      `Client (JSON): ${args["client_json"] ?? "{}"}`,
      `Tone: ${tone}`,
      `Transactions (JSON): ${args["transactions_json"] ?? "[]"}`,
    ];
    return {
      messages: [
        { role: "user", content: { type: "text", text: SYSTEM } },
        { role: "user", content: { type: "text", text: userLines.join("\n") } },
      ],
    };
  },
};

export const CHASE_DRAFT_SYSTEM = SYSTEM;
