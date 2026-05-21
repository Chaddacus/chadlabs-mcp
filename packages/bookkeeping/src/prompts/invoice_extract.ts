import type { Prompt } from "../__core_shim__.js";

const SYSTEM = `You are a bookkeeping assistant. Extract structured invoice data from the email body the user provides.

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
- vendor.normalized_name: lowercase, spaces only, no punctuation.
- vendor.email: include only if visible in the email.
- issue_date / due_date: ISO 8601 (YYYY-MM-DD) when present.
- amount_total: numeric, no currency symbols.
- currency: 3-letter ISO code (USD, EUR, GBP, CAD, ...). Default USD only if context makes it clear.
- line_items: extract each line individually. If only a single total is present, return one item with description equal to the email's primary service descriptor.
- suggested_category: pick the most appropriate category from the chart of accounts loaded as the "bookkeeping://categories" resource. Prefer specific subcategories over parents.
- confidence: 0.0 to 1.0 — your own honest read on extraction quality.
- notes: caveats, ambiguities, missing fields, any reason a human should double-check.

Do not invent values. If a field is genuinely missing, omit it (optional fields) or list the gap in "notes".`;

export const invoiceExtractPrompt: Prompt = {
  name: "invoice_extract",
  description:
    "System prompt + JSON schema for extracting structured invoice data from an email body. The host's LLM does the extraction; this prompt enforces the output shape.",
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
  ],
  render(args) {
    const lines: string[] = [];
    if (args["email_from"]) lines.push(`From: ${args["email_from"]}`);
    if (args["email_subject"]) lines.push(`Subject: ${args["email_subject"]}`);
    if (lines.length) lines.push("");
    lines.push(args["email_body"] ?? "");
    return {
      messages: [
        { role: "user", content: { type: "text", text: SYSTEM } },
        { role: "user", content: { type: "text", text: lines.join("\n") } },
      ],
    };
  },
};

export const INVOICE_EXTRACT_SYSTEM = SYSTEM;
