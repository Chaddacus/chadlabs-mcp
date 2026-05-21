import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Tool } from "@chadlabs/core";
import { getDb } from "../db/connection.js";

export const VendorRememberInputSchema = z.object({
  name: z.string().min(1),
  normalized_name: z.string().min(1),
  default_category: z.string().min(1),
  notes: z.string().optional(),
});

export type VendorRememberInput = z.infer<typeof VendorRememberInputSchema>;

async function vendorRememberHandler(args: VendorRememberInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const db = getDb();
  const existing = db
    .prepare(`SELECT id FROM vendors WHERE normalized_name = ?`)
    .get(args.normalized_name) as { id: string } | undefined;

  let id: string;
  let action: "inserted" | "updated";
  if (existing) {
    id = existing.id;
    db.prepare(
      `UPDATE vendors SET name = ?, default_category = ?, notes = ? WHERE id = ?`
    ).run(args.name, args.default_category, args.notes ?? null, id);
    action = "updated";
  } else {
    id = randomUUID();
    db.prepare(
      `INSERT INTO vendors (id, name, normalized_name, default_category, notes)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, args.name, args.normalized_name, args.default_category, args.notes ?? null);
    action = "inserted";
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ id, action, normalized_name: args.normalized_name }),
      },
    ],
  };
}

export const vendorRememberTool: Tool<VendorRememberInput> = {
  name: "vendor_remember",
  description:
    "Upsert a vendor into the local SQLite vendor index so future extractions consistently classify them. Returns the vendor id and whether the row was inserted or updated.",
  inputSchema: VendorRememberInputSchema,
  handler: vendorRememberHandler,
};
