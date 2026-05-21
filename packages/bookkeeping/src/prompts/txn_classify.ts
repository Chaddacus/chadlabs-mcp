import type { Prompt } from "../__core_shim__.js";

const SYSTEM = `You are a bookkeeping assistant. Classify the bank/credit-card transactions the user provides into expense categories.

Return ONLY a single JSON object matching this exact schema, no markdown fences, no commentary:

{
  "classifications": [
    {
      "id": string,
      "category": string,
      "confidence": number,
      "reason": string,
      "vendor_normalized": string?
    }
  ]
}

Field rules:
- id: same id as the input transaction. Return exactly one classification per input transaction, in the same order.
- category: pick from the chart of accounts loaded as the "bookkeeping://categories" resource. Use parent categories only when no subcategory fits.
- confidence: 0.0 to 1.0 — your own honest read.
- reason: one sentence explaining the classification.
- vendor_normalized: lowercase canonical vendor name when detectable (e.g. "amzn mktp" -> "amazon", "uber trip" -> "uber").

Hints:
- If a "known_vendors" hint is provided in the input, prefer the listed default_category for matching transactions and bias toward that vendor's normalized form.
- Common patterns:
  - "AMZN", "AWS", "GOOGLE CLOUD", "GCP" -> Cloud Hosting or Technology
  - "UBER", "LYFT", "DELTA", "UNITED", "MARRIOTT" -> Travel
  - "OPENAI", "ANTHROPIC", "GITHUB", "NOTION", "FIGMA" -> Software & SaaS
  - "DOORDASH", "STARBUCKS", "CHIPOTLE" -> Meals & Entertainment
  - "GUSTO", "JUSTWORKS" -> Salaries & Wages / Benefits
  - "STRIPE PAYOUT" (negative amount) -> Services Revenue
  - Wire transfers / opaque POS without context -> Uncategorized

Never invent transactions. If the input list is empty, return classifications: [].`;

export const txnClassifyPrompt: Prompt = {
  name: "txn_classify",
  description:
    "System prompt for classifying bank/credit-card transactions into chart-of-accounts categories with confidence + reasoning. The host's LLM does the classification.",
  arguments: [
    {
      name: "transactions_json",
      description:
        "JSON-encoded array of transactions. Each must have id, date, amount, description.",
      required: true,
    },
    {
      name: "known_vendors_json",
      description:
        "Optional JSON-encoded array of known vendor hints: [{ name, default_category }, ...]. Improves consistency.",
      required: false,
    },
  ],
  render(args) {
    const userLines: string[] = [];
    if (args["known_vendors_json"]) {
      userLines.push(`Known vendor hints (JSON): ${args["known_vendors_json"]}`);
    }
    userLines.push(`Transactions (JSON): ${args["transactions_json"] ?? "[]"}`);
    return {
      messages: [
        { role: "user", content: { type: "text", text: SYSTEM } },
        { role: "user", content: { type: "text", text: userLines.join("\n") } },
      ],
    };
  },
};

export const TXN_CLASSIFY_SYSTEM = SYSTEM;
