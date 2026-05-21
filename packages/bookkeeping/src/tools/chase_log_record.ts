import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Tool } from "@chadlabs/core";
import { getDb } from "../db/connection.js";

export const ChaseLogRecordInputSchema = z.object({
  client_email: z.string().email(),
  transaction_ids: z.array(z.string()).min(1),
  draft_subject: z.string().min(1),
  draft_body: z.string().min(1),
  status: z.enum(["draft", "sent", "resolved"]).optional(),
});

export type ChaseLogRecordInput = z.infer<typeof ChaseLogRecordInputSchema>;

async function chaseLogRecordHandler(args: ChaseLogRecordInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const db = getDb();
  const id = randomUUID();
  const status = args.status ?? "draft";
  const now = new Date().toISOString();

  // We store one row per (chase event, transaction) so each followed-up txn is
  // tracked. transaction_id is the per-txn link; draft fields repeat by design
  // — chase_log is an audit trail, not a normalized table.
  const insert = db.prepare(
    `INSERT INTO chase_log
     (id, transaction_id, client_email, draft_subject, draft_body, status, sent_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((txIds: string[]) => {
    for (const txId of txIds) {
      const rowId = randomUUID();
      insert.run(
        rowId,
        txId,
        args.client_email,
        args.draft_subject,
        args.draft_body,
        status,
        status === "sent" ? now : null,
        status === "resolved" ? now : null
      );
    }
  });
  tx(args.transaction_ids);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          chase_id: id,
          transaction_count: args.transaction_ids.length,
          status,
          recorded_at: now,
        }),
      },
    ],
  };
}

export const chaseLogRecordTool: Tool<ChaseLogRecordInput> = {
  name: "chase_log_record",
  description:
    "Record a client-chase email draft to the local SQLite chase log, one row per referenced transaction. Use after the host LLM produces a chase_draft.",
  inputSchema: ChaseLogRecordInputSchema,
  handler: chaseLogRecordHandler,
};
