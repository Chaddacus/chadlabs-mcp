import type { Tool } from "@chadlabs/core";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";
import { MONTH_END_CHECKLIST, findChecklistItem } from "../cockpit/checklist.js";

const MonthEndStatusInputSchema = z.object({
  client_slug: z.string().min(1, "client_slug required"),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "period must be YYYY-MM"),
  /**
   * Optional set/uncheck operation. Omit to just read the current state for
   * (client_slug, period). When provided, marks one checklist item as
   * checked or unchecked and returns the full updated checklist.
   */
  set: z
    .object({
      item_key: z.string().min(1),
      checked: z.boolean(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type MonthEndStatusInput = z.infer<typeof MonthEndStatusInputSchema>;

interface ChecklistRow {
  item_key: string;
  checked: number;
  checked_at: string | null;
  notes: string | null;
}

export const monthEndStatusTool: Tool<MonthEndStatusInput> = {
  name: "month_end_status",
  description:
    "Read or update the month-end checklist for a (client, period) pair. Without `set`, returns the canonical 15-item checklist with per-item checked status. With `set`, toggles one item. Hydrates missing checklist rows lazily on first read so a new client + period starts unchecked.",
  inputSchema: MonthEndStatusInputSchema,
  async handler(input) {
    const db = getDb();

    const client = db
      .prepare("SELECT id FROM clients WHERE normalized_slug = ?")
      .get(input.client_slug) as { id: string } | undefined;

    if (!client) {
      throw new Error(
        `unknown client_slug "${input.client_slug}" — register via client_register first`
      );
    }

    if (input.set) {
      const item = findChecklistItem(input.set.item_key);
      if (!item) {
        throw new Error(
          `unknown item_key "${input.set.item_key}". Known: ${MONTH_END_CHECKLIST.map((c) => c.key).join(", ")}`
        );
      }
      const existing = db
        .prepare(
          "SELECT id FROM month_end_checklist WHERE client_id = ? AND period = ? AND item_key = ?"
        )
        .get(client.id, input.period, item.key) as { id: string } | undefined;

      const checkedInt = input.set.checked ? 1 : 0;
      const checkedAt = input.set.checked ? new Date().toISOString() : null;

      if (existing) {
        db.prepare(
          `UPDATE month_end_checklist SET checked = ?, checked_at = ?, notes = COALESCE(?, notes)
           WHERE id = ?`
        ).run(checkedInt, checkedAt, input.set.notes ?? null, existing.id);
      } else {
        db.prepare(
          `INSERT INTO month_end_checklist (id, client_id, period, item_key, item_label, checked, checked_at, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          randomUUID(),
          client.id,
          input.period,
          item.key,
          item.label,
          checkedInt,
          checkedAt,
          input.set.notes ?? null
        );
      }
    }

    // Read full checklist state, hydrating defaults for items that have no row yet.
    const rows = db
      .prepare<[string, string], ChecklistRow>(
        `SELECT item_key, checked, checked_at, notes FROM month_end_checklist
         WHERE client_id = ? AND period = ?`
      )
      .all(client.id, input.period);
    const rowByKey = new Map(rows.map((r) => [r.item_key, r]));

    const checklist = MONTH_END_CHECKLIST.map((item) => {
      const r = rowByKey.get(item.key);
      return {
        order: item.order,
        item_key: item.key,
        item_label: item.label,
        description: item.description,
        checked: r ? r.checked === 1 : false,
        checked_at: r?.checked_at ?? null,
        notes: r?.notes ?? null,
      };
    });

    const completedCount = checklist.filter((c) => c.checked).length;
    const totalCount = checklist.length;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            client_slug: input.client_slug,
            period: input.period,
            completed: completedCount,
            total: totalCount,
            percent_complete: Math.round((completedCount / totalCount) * 100),
            next_item:
              checklist.find((c) => !c.checked)?.item_key ?? null,
            checklist,
          }),
        },
      ],
    };
  },
};
