/**
 * Canonical month-end checklist items.
 *
 * The host LLM uses this list (via the `month_end_status` tool) to know which
 * checklist items exist for any (client, period) pair. New items can be added
 * but existing item_keys should never change — they're used as DB keys.
 */
export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  /**
   * Items are ordered. Items earlier in the list are usually expected to be
   * completed before later ones. Not a hard constraint — bookkeepers run their
   * own order in practice.
   */
  order: number;
}

export const MONTH_END_CHECKLIST: ReadonlyArray<ChecklistItem> = [
  { key: "bank_recon", label: "Bank reconciliation", description: "All bank accounts reconciled against statement", order: 1 },
  { key: "cc_recon", label: "Credit card reconciliation", description: "All cards reconciled against statement", order: 2 },
  { key: "uncategorized_zero", label: "Uncategorized → 0", description: "No uncategorized transactions left for the period", order: 3 },
  { key: "missing_receipts", label: "Missing receipts chased", description: "Chase emails sent for every transaction lacking a receipt", order: 4 },
  { key: "vendor_review", label: "New vendor review", description: "Any new vendors this period categorized and remembered for next time", order: 5 },
  { key: "owner_draws", label: "Owner draws / distributions reviewed", description: "Owner equity movement classified correctly", order: 6 },
  { key: "intercompany", label: "Intercompany transfers reconciled", description: "Cross-entity transfers balanced (if multi-entity)", order: 7 },
  { key: "loans", label: "Loan / mortgage interest split", description: "Principal vs interest correctly allocated on loan payments", order: 8 },
  { key: "depreciation", label: "Depreciation entries posted", description: "Monthly depreciation per fixed-asset schedule", order: 9 },
  { key: "accruals", label: "Accruals + prepaid amortization", description: "Period-end accruals and amortization of prepaids posted", order: 10 },
  { key: "payroll_match", label: "Payroll reconciled to payroll provider", description: "Gusto / JustWorks / Rippling totals match GL", order: 11 },
  { key: "sales_tax", label: "Sales tax liability reconciled", description: "Sales tax collected matches the liability account, ready for filing", order: 12 },
  { key: "pl_review", label: "P&L review vs prior period", description: "Variance check vs prior month + prior year same month", order: 13 },
  { key: "bs_review", label: "Balance sheet sanity check", description: "AR, AP, accruals, and equity all look right", order: 14 },
  { key: "client_narrative", label: "Client narrative drafted", description: "Plain-English summary of the month emailed to the client", order: 15 },
];

export function findChecklistItem(key: string): ChecklistItem | undefined {
  return MONTH_END_CHECKLIST.find((c) => c.key === key);
}
