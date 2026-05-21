import { z } from "zod";
import { defineExtractor, withLicenseGate } from "@chadlabs/core";
import type { Tool, Extractor } from "../__core_shim__.js";

// ---- schemas ---------------------------------------------------------------

export const TxnInputItemSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  description: z.string(),
});

export const KnownVendorSchema = z.object({
  name: z.string(),
  default_category: z.string(),
});

export const TxnClassifyInputSchema = z.object({
  transactions: z.array(TxnInputItemSchema).min(1),
  known_vendors: z.array(KnownVendorSchema).optional(),
});

export type TxnClassifyInput = z.infer<typeof TxnClassifyInputSchema>;

export const ClassificationItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  vendor_normalized: z.string().optional(),
});

export const TxnClassifyOutputSchema = z.object({
  classifications: z.array(ClassificationItemSchema),
});

export type TxnClassifyOutput = z.infer<typeof TxnClassifyOutputSchema>;

// ---- system prompt ---------------------------------------------------------

const SYSTEM_PROMPT = `You are a bookkeeping assistant that classifies bank and credit card transactions into expense categories.

For each transaction in the input JSON array, return a classification. Your response must be a JSON object with a single key "classifications" containing an array. Each element must match:
{
  "id": string (same id as the input transaction),
  "category": string (one of the standard chart-of-accounts categories),
  "confidence": number (0.0–1.0),
  "reason": string (one-sentence explanation),
  "vendor_normalized": string? (lowercase vendor name if detectable)
}

Standard categories to choose from:
Revenue, Services Revenue, Product Revenue, Other Revenue,
COGS, Direct Labor, Subcontractors, Direct Materials,
Operating Expenses, Office & Admin, Office Supplies, Postage & Shipping, Printing,
Technology, Software & SaaS, Hardware, Cloud Hosting, Domain & Website,
Travel & Meals, Travel, Meals & Entertainment,
Marketing, Advertising, Professional Fees,
Payroll & Benefits, Salaries & Wages, Payroll Taxes, Benefits,
Other Expenses, Uncategorized

Rules:
- If a known_vendors hint is provided, prefer that vendor's default_category for matching transactions.
- Use description patterns to infer vendor: "AMZN", "AWS", "GOOGLE" → Technology; "UBER", "LYFT" → Travel; "OPENAI" → Software & SaaS, etc.
- Return exactly one classification per input transaction, in the same order.
- Return ONLY the JSON object, no markdown fences, no commentary.`;

// ---- extractor instance ----------------------------------------------------

let _extractor: Extractor<TxnClassifyOutput> | null = null;

function getExtractor(): Extractor<TxnClassifyOutput> {
  if (!_extractor) {
    _extractor = defineExtractor({
      name: "txn_classify",
      schema: TxnClassifyOutputSchema,
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  return _extractor;
}

export function _setExtractor(e: Extractor<TxnClassifyOutput>): void {
  _extractor = e;
}

export function _resetExtractor(): void {
  _extractor = null;
}

// ---- handler ---------------------------------------------------------------

async function txnClassifyHandler(parsed: TxnClassifyInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const contextLines: string[] = [];
  if (parsed.known_vendors && parsed.known_vendors.length > 0) {
    contextLines.push(
      "Known vendor hints: " + JSON.stringify(parsed.known_vendors)
    );
  }
  contextLines.push("Transactions: " + JSON.stringify(parsed.transactions));

  const result = await getExtractor().extract(contextLines.join("\n"));
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}

// ---- tool definition -------------------------------------------------------

export const txnClassifyTool: Tool<TxnClassifyInput> = {
  name: "txn_classify",
  description:
    "Classify a list of bank/credit card transactions into expense categories, with a confidence score and short reasoning for each.",
  inputSchema: TxnClassifyInputSchema,
  handler: withLicenseGate(txnClassifyHandler, "bookkeeping-mcp"),
};
