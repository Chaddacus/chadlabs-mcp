import { z } from "zod";
import Database from "better-sqlite3";
import type { Tool } from "@chadlabs/core";
import { getDb } from "../db/connection.js";

export const VendorLookupInputSchema = z.object({
  name: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});

export type VendorLookupInput = z.infer<typeof VendorLookupInputSchema>;

export interface VendorMatch {
  id: string;
  name: string;
  normalized_name: string;
  default_category: string | null;
  notes: string | null;
  match_score: number;
  match_kind: "exact" | "fuzzy";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0 || bLen === 0) return 0;

  const matchDistance = Math.max(0, Math.floor(Math.max(aLen, bLen) / 2) - 1);
  const aMatches = new Array(aLen).fill(false);
  const bMatches = new Array(bLen).fill(false);

  let matches = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  const jaro =
    (matches / aLen + matches / bLen + (matches - transpositions) / matches) / 3;

  // Winkler prefix bonus, max 4 chars
  let prefix = 0;
  for (let i = 0; i < Math.min(4, aLen, bLen); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function lookupVendors(
  db: Database.Database,
  name: string,
  limit: number
): VendorMatch[] {
  const normInput = normalize(name);
  const rows = db
    .prepare(
      `SELECT id, name, normalized_name, default_category, notes FROM vendors`
    )
    .all() as Array<{
    id: string;
    name: string;
    normalized_name: string;
    default_category: string | null;
    notes: string | null;
  }>;

  const scored: VendorMatch[] = rows
    .map((r) => {
      const score = jaroWinkler(normInput, r.normalized_name);
      const kind: "exact" | "fuzzy" =
        normInput === r.normalized_name ? "exact" : "fuzzy";
      return { ...r, match_score: score, match_kind: kind };
    })
    .filter((m) => m.match_score >= 0.85)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);

  return scored;
}

async function vendorLookupHandler(args: VendorLookupInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const limit = args.limit ?? 5;
  const matches = lookupVendors(getDb(), args.name, limit);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ matches }, null, 2),
      },
    ],
  };
}

export const vendorLookupTool: Tool<VendorLookupInput> = {
  name: "vendor_lookup",
  description:
    "Look up a vendor in the local SQLite vendor index by name (exact or fuzzy match >= 0.85 Jaro-Winkler). Returns up to `limit` matches with default category and confidence.",
  inputSchema: VendorLookupInputSchema,
  handler: vendorLookupHandler,
};
