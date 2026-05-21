import type { Prompt } from "@chadlabs/core";

function systemFor(categoriesMarkdown: string | undefined): string {
  const categoriesBlock = categoriesMarkdown
    ? `\n\nCHART OF ACCOUNTS — pick suggested_category from EXACTLY one of these names. Match the casing verbatim. Prefer leaf subcategories over parents.\n\n${categoriesMarkdown}\n`
    : `\n\nFor suggested_category, use the chart of accounts loaded as MCP resource "bookkeeping://categories". The HOST should fetch that resource and inject it here before sending the message; if it has not, default to "Uncategorized".\n`;

  return `You are a bookkeeping assistant. Extract structured invoice data from the email body the user provides.

Return ONLY a single JSON object matching this exact schema, no markdown fences, no commentary:

{
  "vendor": { "name": string, "normalized_name": string, "email": string? },
  "invoice_number": string?,
  "issue_date": string?,
  "due_date": string?,
  "amount_total": number,
  "currency": string,
  "line_items": [{ "description": string, "quantity": number?, "unit_price": number?, "amount": number }],
  "suggested_category": string,
  "confidence": number,
  "notes": string[]
}

Field rules:
- vendor.name: the vendor's customer-facing display name as written on the invoice.
- vendor.normalized_name: a canonical key for vendor lookup. Apply ALL of these transforms:
  1. lowercase
  2. strip legal suffixes: "inc", "inc.", "incorporated", "llc", "l.l.c.", "ltd", "limited", "corp", "corporation", "co", "co.", "company", "gmbh", "ag", "s.a.", "plc", "pty"
  3. strip all punctuation (.,'/&) and trailing commas
  4. collapse whitespace to single spaces, trim
  Example: "Amazon Web Services, Inc." → "amazon web services"; "Shopify Inc." → "shopify"; "Cloudflare, Inc." → "cloudflare".
- vendor.email: include only if visible in the email.
- issue_date / due_date: ISO 8601 (YYYY-MM-DD) when present.
- amount_total: numeric, no currency symbols.
- currency: 3-letter ISO code (USD, EUR, GBP, CAD, ...). Default USD only if context makes it clear.
- line_items: extract each line individually. If only a single total is present, return one item with description equal to the email's primary service descriptor.
- suggested_category: pick the most appropriate category. Use the EXACT name from the chart of accounts below.
- confidence: 0.0 to 1.0 — your own honest read on extraction quality.
- notes: caveats, ambiguities, missing fields, any reason a human should double-check.

Do not invent values. If a field is genuinely missing, omit it (optional fields) or list the gap in "notes".${categoriesBlock}`;
}

export const invoiceExtractPrompt: Prompt = {
  name: "invoice_extract",
  description:
    "System prompt + JSON schema for extracting structured invoice data from an email body. The host's LLM does the extraction; this prompt enforces the output shape. Pass categories_markdown (or fetch the bookkeeping://categories resource and pass its body) to constrain suggested_category to the chart of accounts.",
  arguments: [
    {
      name: "email_body",
      description: "Full email body text containing the invoice.",
      required: true,
    },
    {
      name: "email_from",
      description: "Sender email address (optional context).",
      required: false,
    },
    {
      name: "email_subject",
      description: "Email subject line (optional context).",
      required: false,
    },
    {
      name: "categories_markdown",
      description:
        "Body of the bookkeeping://categories resource. When provided, the prompt constrains suggested_category to those exact names.",
      required: false,
    },
  ],
  render(args) {
    const lines: string[] = [];
    if (args["email_from"]) lines.push(`From: ${args["email_from"]}`);
    if (args["email_subject"]) lines.push(`Subject: ${args["email_subject"]}`);
    if (lines.length) lines.push("");
    lines.push(args["email_body"] ?? "");
    return {
      messages: [
        { role: "user", content: { type: "text", text: systemFor(args["categories_markdown"]) } },
        { role: "user", content: { type: "text", text: lines.join("\n") } },
      ],
    };
  },
};

export const INVOICE_EXTRACT_SYSTEM = systemFor(undefined);
