import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Tool } from "@chadlabs/core";
import { getDb } from "../db/connection.js";

export const AppealLogRecordInputSchema = z.object({
  claim_id: z.string().min(1),
  payer: z.string().min(1),
  denial_reason_code: z.string().optional(),
  appeal_sent_at: z.string().optional(),
  appeal_type: z.enum(["first_level", "second_level", "peer_to_peer", "external_review"]),
  outcome: z.enum(["pending", "overturned", "upheld", "partial"]).optional(),
});

export type AppealLogRecordInput = z.infer<typeof AppealLogRecordInputSchema>;

async function appealLogRecordHandler(args: AppealLogRecordInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const outcome = args.outcome ?? "pending";

  db.prepare(
    `INSERT INTO appeal_log
     (id, claim_id, payer, denial_reason_code, appeal_sent_at, appeal_type, outcome, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    args.claim_id,
    args.payer,
    args.denial_reason_code ?? null,
    args.appeal_sent_at ?? null,
    args.appeal_type,
    outcome,
    now
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          id,
          claim_id: args.claim_id,
          payer: args.payer,
          denial_reason_code: args.denial_reason_code ?? null,
          appeal_sent_at: args.appeal_sent_at ?? null,
          appeal_type: args.appeal_type,
          outcome,
          recorded_at: now,
        }),
      },
    ],
  };
}

export const appealLogRecordTool: Tool<AppealLogRecordInput> = {
  name: "appeal_log_record",
  description:
    "Record an appeal attempt to the local SQLite appeal_log table. Tracks claim_id, payer, denial_reason_code, when the appeal was sent, appeal_type (first_level|second_level|peer_to_peer|external_review), and outcome (pending|overturned|upheld|partial).",
  inputSchema: AppealLogRecordInputSchema,
  handler: appealLogRecordHandler,
};
