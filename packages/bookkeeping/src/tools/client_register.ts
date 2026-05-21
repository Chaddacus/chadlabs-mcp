import type { Tool } from "@chadlabs/core";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";

const ClientRegisterInputSchema = z.object({
  display_name: z.string().min(1, "display_name required"),
  slug: z.string().min(1).optional(),
  qbo_realm_id: z.string().optional(),
  xero_tenant_id: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientRegisterInput = z.infer<typeof ClientRegisterInputSchema>;

function normalize(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const clientRegisterTool: Tool<ClientRegisterInput> = {
  name: "client_register",
  description:
    "Register or update a bookkeeping client (a business entity you manage). Upserts by normalized slug. Use this once per client at onboarding; subsequent calls with the same display_name will update mutable fields without creating a duplicate row.",
  inputSchema: ClientRegisterInputSchema,
  async handler(input) {
    const db = getDb();
    const slug = normalize(input.slug ?? input.display_name);
    if (!slug) {
      throw new Error("could not derive a non-empty slug from display_name");
    }
    const existing = db
      .prepare("SELECT id FROM clients WHERE normalized_slug = ?")
      .get(slug) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE clients SET display_name = ?, qbo_realm_id = COALESCE(?, qbo_realm_id),
         xero_tenant_id = COALESCE(?, xero_tenant_id), notes = COALESCE(?, notes)
         WHERE id = ?`
      ).run(
        input.display_name,
        input.qbo_realm_id ?? null,
        input.xero_tenant_id ?? null,
        input.notes ?? null,
        existing.id
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: existing.id,
              normalized_slug: slug,
              display_name: input.display_name,
              action: "updated",
            }),
          },
        ],
      };
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO clients (id, normalized_slug, display_name, qbo_realm_id, xero_tenant_id, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      slug,
      input.display_name,
      input.qbo_realm_id ?? null,
      input.xero_tenant_id ?? null,
      input.notes ?? null
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id,
            normalized_slug: slug,
            display_name: input.display_name,
            action: "created",
          }),
        },
      ],
    };
  },
};
