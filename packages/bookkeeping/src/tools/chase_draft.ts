import { z } from "zod";
import { defineExtractor, withLicenseGate } from "@chadlabs/core";
import type { Tool, Extractor } from "../__core_shim__.js";

// ---- schemas ---------------------------------------------------------------

export const MissingTypeSchema = z.enum(["receipt", "category", "memo"]);

export const ChaseTransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  description: z.string(),
  missing: MissingTypeSchema,
});

export const ChaseDraftInputSchema = z.object({
  client: z.object({
    name: z.string(),
    email: z.string(),
  }),
  transactions: z.array(ChaseTransactionSchema).min(1),
  tone: z.enum(["friendly", "firm", "neutral"]).optional(),
});

export type ChaseDraftInput = z.infer<typeof ChaseDraftInputSchema>;

export const ChaseDraftOutputSchema = z.object({
  subject: z.string(),
  body_markdown: z.string(),
  body_plain: z.string(),
  transaction_ids: z.array(z.string()),
});

export type ChaseDraftOutput = z.infer<typeof ChaseDraftOutputSchema>;

// ---- system prompt ---------------------------------------------------------

const SYSTEM_PROMPT = `You are a bookkeeping assistant drafting a professional client-chase email to request missing information about transactions.

Given a client name/email, a list of transactions with what is missing ("receipt", "category", or "memo"), and a tone ("friendly", "firm", or "neutral"), produce an email draft.

Your response must be a JSON object with these keys:
{
  "subject": string (concise email subject line),
  "body_markdown": string (the full email body in Markdown, suitable for display),
  "body_plain": string (the same email body in plain text, no markdown),
  "transaction_ids": string[] (the IDs of all transactions referenced in the email)
}

Guidelines:
- Friendly tone: warm, appreciative, assumes good faith ("Just a quick note…")
- Firm tone: professional but direct, implies follow-up if no response ("Please provide… by [date]")
- Neutral tone: factual, no emotional framing
- Group transactions by missing type in the email body for clarity.
- Keep emails concise — bookkeepers and clients are busy.
- Sign off as "Your Bookkeeper" unless a name is apparent.
- Return ONLY the JSON object, no markdown fences, no commentary.`;

// ---- extractor instance ----------------------------------------------------

let _extractor: Extractor<ChaseDraftOutput> | null = null;

function getExtractor(): Extractor<ChaseDraftOutput> {
  if (!_extractor) {
    _extractor = defineExtractor({
      name: "chase_draft",
      schema: ChaseDraftOutputSchema,
      systemPrompt: SYSTEM_PROMPT,
    });
  }
  return _extractor;
}

export function _setExtractor(e: Extractor<ChaseDraftOutput>): void {
  _extractor = e;
}

export function _resetExtractor(): void {
  _extractor = null;
}

// ---- handler ---------------------------------------------------------------

async function chaseDraftHandler(parsed: ChaseDraftInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const context = [
    `Client: ${parsed.client.name} <${parsed.client.email}>`,
    `Tone: ${parsed.tone ?? "friendly"}`,
    `Transactions: ${JSON.stringify(parsed.transactions)}`,
  ].join("\n");

  const result = await getExtractor().extract(context);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}

// ---- tool definition -------------------------------------------------------

export const chaseDraftTool: Tool<ChaseDraftInput> = {
  name: "chase_draft",
  description:
    "Draft a polite client-chase email requesting missing receipts or clarification on uncategorized transactions.",
  inputSchema: ChaseDraftInputSchema,
  handler: withLicenseGate(chaseDraftHandler, "bookkeeping-mcp"),
};
