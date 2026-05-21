import { z } from "zod";
import { defineExtractor, withLicenseGate } from "@chadlabs/core";
import type { Tool, Extractor } from "../__core_shim__.js";

// ---- output schema ---------------------------------------------------------

export const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  amount: z.number(),
});

export const InvoiceExtractOutputSchema = z.object({
  vendor: z.object({
    name: z.string(),
    normalized_name: z.string(),
    email: z.string().optional(),
  }),
  invoice_number: z.string().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  amount_total: z.number(),
  currency: z.string(),
  line_items: z.array(LineItemSchema),
  suggested_category: z.string(),
  confidence: z.number().min(0).max(1),
  notes: z.array(z.string()),
});

export type InvoiceExtractOutput = z.infer<typeof InvoiceExtractOutputSchema>;

// ---- input schema ----------------------------------------------------------

export const InvoiceExtractInputSchema = z.object({
  email_body: z.string(),
  email_from: z.string().optional(),
  email_subject: z.string().optional(),
});

export type InvoiceExtractInput = z.infer<typeof InvoiceExtractInputSchema>;

// ---- system prompt ---------------------------------------------------------

const SYSTEM_PROMPT = `You are a bookkeeping assistant specialized in extracting structured invoice data from email text.

Given an email body (and optionally the sender and subject), extract all invoice information present and return it as structured JSON matching the following schema exactly:

{
  "vendor": { "name": string, "normalized_name": string (lowercase, no punctuation), "email": string? },
  "invoice_number": string?,
  "issue_date": string? (ISO 8601, e.g. "2024-03-15"),
  "due_date": string? (ISO 8601),
  "amount_total": number (numeric, no currency symbols),
  "currency": string (3-letter ISO code, default "USD"),
  "line_items": [{ "description": string, "quantity": number?, "unit_price": number?, "amount": number }],
  "suggested_category": string (pick the most appropriate expense category from a standard chart of accounts),
  "confidence": number (0.0 to 1.0 — how confident are you in the extraction?),
  "notes": string[] (any caveats, ambiguities, or warnings about the extraction)
}

Rules:
- Always normalize the vendor name to lowercase with spaces replacing special characters.
- If information is genuinely missing, omit the field (for optional fields) or use an empty array.
- For suggested_category, prefer categories like: Software & SaaS, Hardware, Travel, Meals & Entertainment, Office Supplies, Professional Fees, Advertising, Cloud Hosting, Subcontractors.
- Do not invent data. If you cannot determine a value with reasonable confidence, note it in "notes".
- Return ONLY the JSON object, no markdown fences, no commentary.`;

// ---- extractor instance ----------------------------------------------------

let _extractor: Extractor<InvoiceExtractOutput> | null = null;

function getExtractor(): Extractor<InvoiceExtractOutput> {
  if (!_extractor) {
    _extractor = defineExtractor({
      name: "invoice_extract",
      schema: InvoiceExtractOutputSchema,
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  return _extractor;
}

// Allow tests to inject a mock extractor
export function _setExtractor(e: Extractor<InvoiceExtractOutput>): void {
  _extractor = e;
}

export function _resetExtractor(): void {
  _extractor = null;
}

// ---- handler ---------------------------------------------------------------

async function invoiceExtractHandler(parsed: InvoiceExtractInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const contextLines: string[] = [];
  if (parsed.email_from) contextLines.push(`From: ${parsed.email_from}`);
  if (parsed.email_subject) contextLines.push(`Subject: ${parsed.email_subject}`);
  contextLines.push("", parsed.email_body);

  const result = await getExtractor().extract(contextLines.join("\n"));
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}

// ---- tool definition -------------------------------------------------------

export const invoiceExtractTool: Tool<InvoiceExtractInput> = {
  name: "invoice_extract",
  description:
    "Extract structured invoice data from an email body, including vendor, amount, due date, line items, and suggested expense category.",
  inputSchema: InvoiceExtractInputSchema,
  handler: withLicenseGate(invoiceExtractHandler, "bookkeeping-mcp"),
};
