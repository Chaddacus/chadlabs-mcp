import type { Resource } from "@chadlabs/core";

/**
 * Standard payer denial reason codes.
 *
 * Loaded by the host LLM as MCP resource `prior-auth://reason-codes` so the
 * classify / appeal prompts can produce consistent reason code values across
 * sessions.
 */
export const REASON_CODES: ReadonlyArray<{
  code: string;
  label: string;
  description: string;
  category: string;
}> = [
  // Medical Necessity
  {
    code: "MN-001",
    label: "Service not medically necessary",
    description: "The payer determined the requested service or procedure does not meet medical necessity criteria under the member's plan.",
    category: "medical_necessity",
  },
  {
    code: "MN-002",
    label: "Level of care not medically necessary",
    description: "The level of care requested (e.g., inpatient vs. outpatient) is not supported by the clinical documentation.",
    category: "medical_necessity",
  },
  {
    code: "MN-003",
    label: "Experimental or investigational",
    description: "The service is classified as experimental or investigational and is not covered under the benefit plan.",
    category: "medical_necessity",
  },
  {
    code: "MN-004",
    label: "Frequency limit exceeded",
    description: "The requested service exceeds the allowed frequency (e.g., physical therapy sessions per year).",
    category: "medical_necessity",
  },

  // Coverage
  {
    code: "CV-001",
    label: "Service excluded from plan",
    description: "The specific service or procedure is explicitly excluded from the member's benefit plan.",
    category: "coverage",
  },
  {
    code: "CV-002",
    label: "Not a covered benefit",
    description: "The benefit requested does not exist in the member's plan design.",
    category: "coverage",
  },
  {
    code: "CV-003",
    label: "Out-of-network provider",
    description: "The claim was submitted by a provider not in the member's network and out-of-network benefits were not applicable.",
    category: "coverage",
  },
  {
    code: "CV-004",
    label: "Member not eligible on date of service",
    description: "The member's coverage was not active on the date(s) of service billed.",
    category: "coverage",
  },
  {
    code: "CV-005",
    label: "Coordination of benefits — primary payer responsible",
    description: "Another payer has been identified as primary and should process the claim first.",
    category: "coverage",
  },

  // Documentation
  {
    code: "DOC-001",
    label: "Documentation missing or incomplete",
    description: "Required clinical documentation was not submitted with the request or claim.",
    category: "documentation",
  },
  {
    code: "DOC-002",
    label: "Records do not support diagnosis",
    description: "The submitted clinical records do not support the diagnosis code(s) billed.",
    category: "documentation",
  },
  {
    code: "DOC-003",
    label: "Progress notes missing",
    description: "Progress notes for the treatment period are absent from the submitted documentation.",
    category: "documentation",
  },
  {
    code: "DOC-004",
    label: "Physician orders not present",
    description: "Ordering physician documentation or referral orders were not included.",
    category: "documentation",
  },

  // Administrative
  {
    code: "ADM-001",
    label: "Timely filing limit exceeded",
    description: "The claim or appeal was not filed within the payer's required timely filing window.",
    category: "administrative",
  },
  {
    code: "ADM-002",
    label: "Duplicate claim",
    description: "A claim for the same service, date, and member has already been processed.",
    category: "administrative",
  },
  {
    code: "ADM-003",
    label: "Incorrect billing code",
    description: "The procedure or diagnosis code submitted does not accurately reflect the service rendered.",
    category: "administrative",
  },
  {
    code: "ADM-004",
    label: "Missing or invalid referral",
    description: "A valid referral from the primary care physician is required but was not obtained.",
    category: "administrative",
  },

  // Formulary
  {
    code: "FORM-001",
    label: "Drug not on formulary",
    description: "The requested medication is not included in the payer's approved drug formulary.",
    category: "formulary",
  },
  {
    code: "FORM-002",
    label: "Step therapy required",
    description: "The payer requires the member to try and fail a less costly drug before the requested medication is approved.",
    category: "formulary",
  },
  {
    code: "FORM-003",
    label: "Quantity limit exceeded",
    description: "The prescribed quantity or days supply exceeds the payer's formulary quantity limit.",
    category: "formulary",
  },

  // Prior Auth Required
  {
    code: "PA-001",
    label: "Prior authorization required",
    description: "The service requires prior authorization which was not obtained before the service was rendered.",
    category: "prior_auth_required",
  },
  {
    code: "PA-002",
    label: "Prior authorization expired",
    description: "A prior authorization was obtained but the service was rendered after the authorization expiration date.",
    category: "prior_auth_required",
  },
  {
    code: "PA-003",
    label: "Service does not match authorized procedure",
    description: "The procedure billed does not match the procedure for which prior authorization was granted.",
    category: "prior_auth_required",
  },
];

function renderReasonCodesMarkdown(): string {
  const lines: string[] = ["# Payer Denial Reason Codes", "", "Use the exact `code` field when classifying or appealing. Prefer the most specific code.", ""];

  const categories: Record<string, string> = {
    medical_necessity: "Medical Necessity",
    coverage: "Coverage",
    documentation: "Documentation",
    administrative: "Administrative",
    formulary: "Formulary",
    prior_auth_required: "Prior Authorization Required",
  };

  for (const [catKey, catLabel] of Object.entries(categories)) {
    const codes = REASON_CODES.filter((c) => c.category === catKey);
    if (codes.length === 0) continue;
    lines.push(`## ${catLabel}`);
    lines.push("");
    for (const c of codes) {
      lines.push(`- **${c.code}** — ${c.label}: ${c.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export const REASON_CODES_MARKDOWN = renderReasonCodesMarkdown();

export const reasonCodesResource: Resource = {
  uri: "prior-auth://reason-codes",
  name: "Payer denial reason codes",
  description:
    "Standard payer denial reason codes across medical_necessity, coverage, documentation, administrative, formulary, and prior_auth_required categories. Load this so classify/appeal prompts produce consistent codes.",
  mimeType: "text/markdown",
  async read() {
    return renderReasonCodesMarkdown();
  },
};
