import type { Tool } from "@chadlabs/core";
import { z } from "zod";
import { getDb } from "../db/connection.js";

const ClientSummaryInputSchema = z.object({
  status_filter: z.enum(["active", "archived", "all"]).default("active").optional(),
});

export type ClientSummaryInput = z.infer<typeof ClientSummaryInputSchema>;

interface ClientRow {
  id: string;
  normalized_slug: string;
  display_name: string;
  status: string;
  qbo_realm_id: string | null;
  xero_tenant_id: string | null;
}

export const clientSummaryTool: Tool<ClientSummaryInput> = {
  name: "client_summary",
  description:
    "Roster view across all bookkeeping clients. Returns per-client counts: known vendors, open chase-log entries, total chase-log entries. Use as the entry point for a month-end review session — the host LLM can then drill into individual clients.",
  inputSchema: ClientSummaryInputSchema,
  async handler(input) {
    const db = getDb();
    const status = input.status_filter ?? "active";
    const where =
      status === "all"
        ? ""
        : status === "archived"
        ? "WHERE status = 'archived' OR archived_at IS NOT NULL"
        : "WHERE status = 'active' AND archived_at IS NULL";

    const clients = db
      .prepare<[], ClientRow>(
        `SELECT id, normalized_slug, display_name, status, qbo_realm_id, xero_tenant_id
         FROM clients ${where} ORDER BY display_name ASC`
      )
      .all();

    // We aggregate by best-effort: chase_log has no client_id today (it carries
    // client_email instead, since the chase tool was built before the cockpit).
    // The host LLM can join on emails when needed. For v1 we just count globally.
    const totalChases = (
      db.prepare("SELECT COUNT(*) as c FROM chase_log").get() as { c: number }
    ).c;
    const openChases = (
      db
        .prepare("SELECT COUNT(*) as c FROM chase_log WHERE status = 'draft' OR status = 'sent'")
        .get() as { c: number }
    ).c;
    const knownVendors = (
      db.prepare("SELECT COUNT(*) as c FROM vendors").get() as { c: number }
    ).c;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            clients: clients.map((c) => ({
              id: c.id,
              slug: c.normalized_slug,
              display_name: c.display_name,
              status: c.status,
              qbo_realm_id: c.qbo_realm_id,
              xero_tenant_id: c.xero_tenant_id,
            })),
            client_count: clients.length,
            globals: {
              known_vendors: knownVendors,
              open_chases: openChases,
              total_chases: totalChases,
            },
            note:
              "v0.2 cockpit: vendor / chase counts are workspace-wide, not per-client. Per-client splits land in v0.3 once chase_log carries client_id.",
          }),
        },
      ],
    };
  },
};
