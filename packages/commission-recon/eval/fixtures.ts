import type { DisputeFixture } from "./types.js";

/* Synthetic commission discrepancy fixtures. All policy numbers, dollar
 * amounts, and carrier names are fake. */
export const DISPUTE_FIXTURES: DisputeFixture[] = [
  {
    id: "d-shortpay-friendly",
    discrepancy: {
      policy_number: "POL-TEST-10001",
      carrier: "Aetna",
      statement_period: "April 2026",
      expected_commission: 1850.0,
      actual_commission: 1480.0,
      status: "short_pay",
      notes: "Producer agreement schedule shows 10% first-year; statement applied 8%.",
    },
    tone: "friendly",
    rubric:
      "MUST: (1) name policy POL-TEST-10001 and the April 2026 statement period, (2) cite the exact $ delta ($370) or both amounts ($1850 expected vs $1480 actual), (3) reference the producer agreement / rate schedule discrepancy, (4) end with a specific ask (corrected statement, reissue, or call), (5) friendly tone — polite opener, not aggressive. MUST NOT invent rates, names, or other policies.",
  },
  {
    id: "d-missing-firm",
    discrepancy: {
      policy_number: "POL-TEST-10002",
      carrier: "Anthem BCBS",
      statement_period: "March 2026",
      expected_commission: 2200.0,
      actual_commission: 0.0,
      status: "missing",
      notes: "Policy active and premium paid March 2026 per portal; commission not appearing on statement.",
    },
    tone: "firm",
    rubric:
      "MUST: (1) name policy POL-TEST-10002 and March 2026 statement, (2) state the full $2200 is missing (not a delta — entire commission absent), (3) reference that the policy is active and premium was paid (per portal), (4) demand a written response within 10 business days, (5) firm but professional tone — specific, not hostile. MUST NOT speculate about WHY it was missed (mistake vs intentional).",
  },
  {
    id: "d-renewal-rate-friendly",
    discrepancy: {
      policy_number: "POL-TEST-10003",
      carrier: "United Healthcare",
      statement_period: "April 2026",
      expected_commission: 980.0,
      actual_commission: 720.0,
      status: "rate_mismatch",
      notes: "Statement applied 4% renewal rate; producer agreement specifies 5% for years 2-3 of policies sourced from broker channel.",
    },
    tone: "friendly",
    rubric:
      "MUST: (1) name policy POL-TEST-10003 and April 2026 statement, (2) cite both the 4% applied vs 5% contracted (or the $260 delta), (3) reference the producer agreement / broker channel rate, (4) end with a specific ask, (5) friendly tone. MUST NOT invent producer agreement clauses beyond what's stated, MUST NOT compare to other carriers.",
  },
  {
    id: "d-chargeback-firm",
    discrepancy: {
      policy_number: "POL-TEST-10004",
      carrier: "Cigna",
      statement_period: "April 2026",
      expected_commission: 1450.0,
      actual_commission: -1450.0,
      status: "chargeback_disputed",
      notes: "Carrier charged back the full first-year commission citing policy cancellation. Member confirms policy is still active; cancellation appears to be a carrier data error.",
    },
    tone: "firm",
    rubric:
      "MUST: (1) name policy POL-TEST-10004 and April 2026 statement, (2) state the chargeback amount ($1450 reversal, total impact $2900), (3) state that the member confirms policy is still active and cancellation is a carrier data error, (4) demand the chargeback be reversed pending verification, (5) request written response within 10 business days, (6) firm tone. MUST NOT accuse the carrier of bad faith; the framing is 'data error to be corrected'.",
  },
  {
    id: "d-prior-pattern-friendly",
    discrepancy: {
      policy_number: "POL-TEST-10005",
      carrier: "Humana",
      statement_period: "April 2026",
      expected_commission: 620.0,
      actual_commission: 496.0,
      status: "short_pay",
    },
    tone: "friendly",
    policy_history: [
      { statement_period: "Feb 2026", expected: 620, actual: 496, outcome: "corrected on next statement" },
      { statement_period: "Mar 2026", expected: 620, actual: 496, outcome: "corrected on next statement" },
    ],
    rubric:
      "MUST: (1) name policy POL-TEST-10005 and April 2026 statement, (2) cite the $124 delta or both amounts, (3) reference that this is the third consecutive month with the same delta (Feb, Mar, Apr), (4) request a root-cause fix not just a one-off correction, (5) friendly but pointed tone — pattern matters. MUST NOT threaten or escalate beyond requesting a root-cause review.",
  },
];
