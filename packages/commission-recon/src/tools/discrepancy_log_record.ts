import type { Tool } from "@chadlabs/core";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";

const InputSchema = z.object({
  policy_number: z.string().min(1),
  carrier: z.string().min(1),
  statement_period: z.string().min(1),
  expected_commission: z.number(),
  actual_commission: z.number(),
  status: z
    .enum(["underpaid", "overpaid", "missing", "disputed", "resolved"])
    .default("underpaid")
    .optional(),
  notes: z.string().optional(),
});

export type DiscrepancyLogRecordInput = z.infer<typeof InputSchema>;

export const discrepancyLogRecordTool: Tool<DiscrepancyLogRecordInput> = {
  name: "discrepancy_log_record",
  description:
    "Record a commission discrepancy in the audit log. One row per policy + statement_period pair, status defaults to 'underpaid'. Use as the canonical record for what gets disputed, what's still open, and what has been resolved.",
  inputSchema: InputSchema,
  async handler(input) {
    const db = getDb();
    const id = randomUUID();
    const status = input.status ?? "underpaid";
    db.prepare(
      `INSERT INTO discrepancy_log
       (id, policy_number, carrier, statement_period, expected_commission, actual_commission, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.policy_number,
      input.carrier,
      input.statement_period,
      input.expected_commission,
      input.actual_commission,
      status,
      input.notes ?? null
    );
    const delta = input.actual_commission - input.expected_commission;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id,
            policy_number: input.policy_number,
            status,
            delta: Math.round(delta * 100) / 100,
            delta_kind: delta < 0 ? "underpaid" : delta > 0 ? "overpaid" : "match",
          }),
        },
      ],
    };
  },
};
