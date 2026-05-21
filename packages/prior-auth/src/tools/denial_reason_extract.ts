import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Tool } from "@chadlabs/core";
import { getDb } from "../db/connection.js";

export const DenialReasonExtractInputSchema = z.object({
  denial_text: z.string().min(1),
});

export type DenialReasonExtractInput = z.infer<typeof DenialReasonExtractInputSchema>;

export interface DenialExtraction {
  payer: string | null;
  member_id: string | null;
  claim_id: string | null;
  denial_reason_code: string | null;
  denial_reason_text: string | null;
  raw_excerpt: string;
}

/**
 * Regex-based extraction over common payer denial-letter patterns.
 * Returns best-effort structured fields from raw denial text.
 */
export function extractFromDenialText(text: string): DenialExtraction {
  const raw_excerpt = text.slice(0, 500);

  // Payer name — look for known payer names in the text
  const payerPatterns: Array<[RegExp, string]> = [
    [/united\s*health(?:care)?/i, "UnitedHealthcare"],
    [/aetna/i, "Aetna"],
    [/cigna/i, "Cigna"],
    [/humana/i, "Humana"],
    [/anthem/i, "Anthem"],
    [/kaiser\s*permanente/i, "Kaiser Permanente"],
    [/blue\s*cross.*blue\s*shield|bcbs/i, "Blue Cross Blue Shield"],
    [/centene/i, "Centene"],
    [/molina/i, "Molina Healthcare"],
    [/wellcare/i, "WellCare"],
  ];
  let payer: string | null = null;
  for (const [re, name] of payerPatterns) {
    if (re.test(text)) {
      payer = name;
      break;
    }
  }

  // Member ID
  const memberPatterns = [
    /member\s*(?:id|number|#)[:\s]+([A-Z0-9\-]{4,20})/i,
    /subscriber\s*id[:\s]+([A-Z0-9\-]{4,20})/i,
    /member#[:\s]+([A-Z0-9\-]{4,20})/i,
    /id[:\s]+([A-Z0-9\-]{6,20})/i,
  ];
  let member_id: string | null = null;
  for (const re of memberPatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      member_id = m[1].trim();
      break;
    }
  }

  // Claim ID
  const claimPatterns = [
    /claim\s*(?:id|number|#)[:\s]+([A-Z0-9\-]{4,30})/i,
    /claim#[:\s]+([A-Z0-9\-]{4,30})/i,
    /reference\s*(?:number|#)[:\s]+([A-Z0-9\-]{4,30})/i,
  ];
  let claim_id: string | null = null;
  for (const re of claimPatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      claim_id = m[1].trim();
      break;
    }
  }

  // Denial reason code — look for known reason code patterns
  const reasonCodePatterns = [
    /\b(MN-00[1-4])\b/,
    /\b(CV-00[1-5])\b/,
    /\b(DOC-00[1-4])\b/,
    /\b(ADM-00[1-4])\b/,
    /\b(FORM-00[1-3])\b/,
    /\b(PA-00[1-3])\b/,
  ];
  let denial_reason_code: string | null = null;
  for (const re of reasonCodePatterns) {
    const m = text.match(re);
    if (m?.[1]) {
      denial_reason_code = m[1];
      break;
    }
  }

  // Denial reason text — look for common denial reason phrases
  const reasonTextPatterns: Array<[RegExp, string]> = [
    [/not\s+medically\s+necessary/i, "Service not medically necessary"],
    [/experimental\s+(?:or\s+)?investigational/i, "Experimental or investigational"],
    [/not\s+(?:a\s+)?covered\s+benefit/i, "Not a covered benefit"],
    [/excluded\s+from\s+(?:(?:the|your)\s+)?(?:plan|benefit)/i, "Service excluded from plan"],
    [/out.of.network/i, "Out-of-network provider"],
    [/not\s+eligible/i, "Member not eligible on date of service"],
    [/documentation\s+(?:is\s+)?(?:missing|incomplete|not\s+(?:provided|submitted))/i, "Documentation missing or incomplete"],
    [/prior\s+auth(?:orization)?\s+(?:is\s+)?(?:required|not\s+obtained)/i, "Prior authorization required"],
    [/step\s+therapy/i, "Step therapy required"],
    [/not\s+on\s+(?:the\s+)?formulary/i, "Drug not on formulary"],
    [/timely\s+filing/i, "Timely filing limit exceeded"],
    [/duplicate\s+claim/i, "Duplicate claim"],
    [/frequency\s+limit/i, "Frequency limit exceeded"],
  ];
  let denial_reason_text: string | null = null;
  for (const [re, label] of reasonTextPatterns) {
    if (re.test(text)) {
      denial_reason_text = label;
      break;
    }
  }

  return { payer, member_id, claim_id, denial_reason_code, denial_reason_text, raw_excerpt };
}

async function denialReasonExtractHandler(args: DenialReasonExtractInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  const extraction = extractFromDenialText(args.denial_text);

  db.prepare(
    `INSERT INTO denial_extractions
     (id, claim_id, payer, member_id, denial_reason_code, denial_reason_text, raw_excerpt, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    extraction.claim_id,
    extraction.payer,
    extraction.member_id,
    extraction.denial_reason_code,
    extraction.denial_reason_text,
    extraction.raw_excerpt,
    now
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ id, ...extraction, extracted_at: now }),
      },
    ],
  };
}

export const denialReasonExtractTool: Tool<DenialReasonExtractInput> = {
  name: "denial_reason_extract",
  description:
    "Extract structured fields from a payer denial letter (payer, member_id, claim_id, denial_reason_code, denial_reason_text). Uses regex-based pattern matching over common payer letter formats. Persists the extraction to the local denial_extractions table.",
  inputSchema: DenialReasonExtractInputSchema,
  handler: denialReasonExtractHandler,
};
