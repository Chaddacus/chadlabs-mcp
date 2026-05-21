// TODO: remove this shim once @chadlabs/core is published — for now bookkeeping
// imports types from here (so vitest can swap the alias) and the same names
// from `@chadlabs/core` at runtime.

import Database from "better-sqlite3";
import type { ZodSchema } from "zod";

export type { Database };

// ---- tools ----------------------------------------------------------------

export type ToolHandler<T> = (
  args: T
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<T>;
  handler: ToolHandler<T>;
}

// ---- prompts --------------------------------------------------------------

export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface Prompt {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  render(args: Record<string, string>): {
    messages: Array<{
      role: "user" | "assistant";
      content: { type: "text"; text: string };
    }>;
  };
}

// ---- resources ------------------------------------------------------------

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  read(): Promise<string>;
}

// ---- migration ------------------------------------------------------------

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

// ---- minimal server stub (used by vitest alias) ---------------------------

export interface MCPServer {
  serve(): Promise<void>;
}

export function defineMCPServer(opts: {
  name: string;
  version: string;
  tools?: Tool[];
  prompts?: Prompt[];
  resources?: Resource[];
}): MCPServer {
  return {
    async serve() {
      // No-op in shim; real impl is in @chadlabs/core. Tests don't exercise serve().
      void opts;
    },
  };
}

export function withLicenseGate<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>,
  _productSlug: string
): typeof handler {
  return handler;
}

export function openDb(path: string): Database.Database {
  return new Database(path);
}

export function migrate(
  db: Database.Database,
  migrations: Migration[]
): { applied: number[]; skipped: number[] } {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  const applied: number[] = [];
  const skipped: number[] = [];
  const seen = new Set<number>(
    (
      db.prepare("SELECT version FROM _migrations").all() as Array<{
        version: number;
      }>
    ).map((r) => r.version)
  );
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  for (const m of sorted) {
    if (seen.has(m.version)) {
      skipped.push(m.version);
      continue;
    }
    db.exec(m.sql);
    db.prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)").run(
      m.version,
      m.name
    );
    applied.push(m.version);
  }
  return { applied, skipped };
}
