import type { Prompt } from "@chadlabs/core";

function systemFor(categoriesMarkdown: string | undefined): string {
  const categoriesBlock = categoriesMarkdown
    ? `\n\nCHART OF ACCOUNTS — pick category from EXACTLY one of these names. Match casing verbatim. Prefer leaf subcategories over parents.\n\n${categoriesMarkdown}\n`
    : `\n\nFor category, use the chart of accounts loaded as MCP resource "bookkeeping://categories". The HOST should fetch that resource and inject it before sending; if it has not, return "Uncategorized" for transactions you cannot place.\n`;

  return `You are a bookkeeping assistant. Classify the bank/credit-card transactions the user provides into expense categories.

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
- category: use the EXACT name from the chart of accounts. Use parent categories only when no subcategory fits.
- confidence: 0.0 to 1.0 — your own honest read.
- reason: one sentence explaining the classification.
- vendor_normalized: lowercase canonical vendor name when detectable (e.g. "amzn mktp" -> "amazon", "uber trip" -> "uber"). Strip legal suffixes (inc, llc, ltd, corp, co).

Hints:
- If a "known_vendors" hint is provided in the input, prefer the listed default_category for matching transactions and bias toward that vendor's normalized form.
- Common patterns:
  - "AMZN", "AWS", "GOOGLE CLOUD", "GCP", "VERCEL", "CLOUDFLARE" -> Cloud Hosting
  - "UBER", "LYFT", "DELTA", "UNITED", "MARRIOTT" -> Travel
  - "OPENAI", "ANTHROPIC", "GITHUB", "NOTION", "FIGMA", "SLACK" -> Software & SaaS
  - "DOORDASH", "STARBUCKS", "CHIPOTLE", "NOBU" -> Meals & Entertainment
  - "GUSTO", "JUSTWORKS PAYROLL" -> Salaries & Wages
  - "JUSTWORKS HEALTH", "AETNA", "BLUE CROSS" -> Benefits
  - "STRIPE PAYOUT" (negative amount or marked as credit) -> Services Revenue
  - "UPWORK", "FIVERR" milestone payments -> Subcontractors
  - "STAPLES", "OFFICE DEPOT" -> Office Supplies
  - "FEDEX", "UPS", "USPS" -> Postage & Shipping
  - "CPA", "ATTORNEY", "LAW" services -> Professional Fees
  - "REDDIT ADS", "GOOGLE ADS", "META ADS", newsletter sponsorships -> Advertising
  - "AHREFS", "SEMRUSH", "BUFFER" marketing tooling -> Marketing
  - "APPLE", "DELL" laptops/devices -> Hardware
  - "PRINTFUL", inventory/fulfillment -> Direct Materials
  - Wire transfers / opaque POS without context -> Uncategorized

Never invent transactions. If the input list is empty, return classifications: [].${categoriesBlock}`;
}

export const txnClassifyPrompt: Prompt = {
  name: "txn_classify",
  description:
    "System prompt for classifying bank/credit-card transactions into chart-of-accounts categories with confidence + reasoning. The host's LLM does the classification. Pass categories_markdown to constrain the output vocabulary.",
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
    {
      name: "categories_markdown",
      description:
        "Body of the bookkeeping://categories resource. When provided, constrains category to those exact names.",
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
        { role: "user", content: { type: "text", text: systemFor(args["categories_markdown"]) } },
        { role: "user", content: { type: "text", text: userLines.join("\n") } },
      ],
    };
  },
};

export const TXN_CLASSIFY_SYSTEM = systemFor(undefined);
