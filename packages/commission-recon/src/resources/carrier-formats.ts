import type { Resource } from "@chadlabs/core";

/**
 * Per-carrier statement format hints. The host LLM uses these to disambiguate
 * which carrier sent which statement when the parse tool's heuristics return
 * low confidence. v1 ships top-10 carriers; long-tail falls to host LLM.
 */
export const CARRIER_FORMATS: ReadonlyArray<{
  carrier_code: string;
  carrier_name: string;
  kind: "health" | "p_and_c" | "life";
  header_signals: string[];
  format_hint: "tabular_csv" | "two_column_pdf" | "narrative_pdf" | "spreadsheet_grid";
  common_quirks: string[];
}> = [
  { carrier_code: "united_healthcare", carrier_name: "UnitedHealthcare", kind: "health", header_signals: ["UnitedHealthcare", "UHC", "Commission Statement"], format_hint: "tabular_csv", common_quirks: ["Renewal commissions sometimes labeled as 'continuing' instead of 'renewal'", "Member IDs prefixed with 'UHC' on the statement only"] },
  { carrier_code: "aetna", carrier_name: "Aetna", kind: "health", header_signals: ["Aetna Inc", "Aetna Life Insurance", "Commission Detail"], format_hint: "spreadsheet_grid", common_quirks: ["Excel-only export historically", "First-year vs renewal split shown on separate rows"] },
  { carrier_code: "cigna", carrier_name: "Cigna", kind: "health", header_signals: ["Cigna Health", "Cigna Healthcare", "Producer Commission"], format_hint: "tabular_csv", common_quirks: ["Negative amounts indicate clawback, not refund"] },
  { carrier_code: "anthem", carrier_name: "Anthem BCBS", kind: "health", header_signals: ["Anthem", "Anthem Blue Cross", "Commission Summary"], format_hint: "two_column_pdf", common_quirks: ["State-specific BCBS plans show different group IDs"] },
  { carrier_code: "humana", carrier_name: "Humana", kind: "health", header_signals: ["Humana Inc", "Humana Medicare", "Producer Earnings"], format_hint: "tabular_csv", common_quirks: ["Medicare Advantage commissions on a separate ledger than commercial"] },
  { carrier_code: "travelers", carrier_name: "Travelers", kind: "p_and_c", header_signals: ["Travelers Indemnity", "Producer Statement"], format_hint: "narrative_pdf", common_quirks: ["Bundled-policy commissions allocated proportionally and shown as one line"] },
  { carrier_code: "progressive", carrier_name: "Progressive", kind: "p_and_c", header_signals: ["Progressive Casualty", "Agent Commission"], format_hint: "tabular_csv", common_quirks: ["Direct-bill policies show $0 on the producer statement; cross-reference required"] },
  { carrier_code: "liberty_mutual", carrier_name: "Liberty Mutual", kind: "p_and_c", header_signals: ["Liberty Mutual Group", "Producer Detail"], format_hint: "two_column_pdf", common_quirks: ["Endorsement commissions sometimes delayed one statement cycle"] },
  { carrier_code: "allstate", carrier_name: "Allstate", kind: "p_and_c", header_signals: ["Allstate Insurance", "Commission Schedule"], format_hint: "spreadsheet_grid", common_quirks: ["Captive-agent statements look identical to independent; check the agency code"] },
  { carrier_code: "state_farm", carrier_name: "State Farm", kind: "p_and_c", header_signals: ["State Farm Mutual", "Producer Compensation"], format_hint: "narrative_pdf", common_quirks: ["Mostly captive — independent producer statements are rare and may use a different template"] },
];

function renderMarkdown(): string {
  const lines: string[] = ["# Carrier statement format hints", "", "When the parser tool returns a low-confidence carrier, use these signals to disambiguate. Match `header_signals` against the top of the document text.", ""];
  for (const c of CARRIER_FORMATS) {
    lines.push(`## ${c.carrier_name} (${c.carrier_code}, ${c.kind})`);
    lines.push(`- header signals: ${c.header_signals.map((s) => `"${s}"`).join(", ")}`);
    lines.push(`- format hint: \`${c.format_hint}\``);
    lines.push(`- quirks:`);
    for (const q of c.common_quirks) lines.push(`  - ${q}`);
    lines.push("");
  }
  lines.push("> Long-tail carriers not in this list fall to the host LLM's classification. Add new entries as you encounter them.");
  return lines.join("\n");
}

export const CARRIER_FORMATS_MARKDOWN = renderMarkdown();
export const CARRIER_CODES: ReadonlyArray<string> = CARRIER_FORMATS.map((c) => c.carrier_code);

export const carrierFormatsResource: Resource = {
  uri: "commission-recon://carrier-formats",
  name: "Carrier statement formats",
  description: "Top-10 US insurance carriers' commission statement format hints. Inject into the host LLM context when classifying low-confidence statements.",
  mimeType: "text/markdown",
  async read() {
    return CARRIER_FORMATS_MARKDOWN;
  },
};
