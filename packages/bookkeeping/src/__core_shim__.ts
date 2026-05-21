// TODO: remove shim once @chadlabs/core ships
// This shim re-exports a minimal implementation of the core interfaces so that
// the bookkeeping package can be built and tested while @chadlabs/core is being
// developed in a parallel worktree.

import Database from "better-sqlite3";
import type { ZodSchema } from "zod";

export type { Database };

// ---- types ----------------------------------------------------------------

export type ToolHandler<T> = (
  args: T
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<T>;
  handler: ToolHandler<T>;
}

export interface MCPServer {
  serve(): Promise<void>;
}

export interface Extractor<T> {
  extract(input: string): Promise<T>;
}

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

// ---- defineMCPServer ------------------------------------------------------

export function defineMCPServer(opts: {
  name: string;
  version: string;
  tools: Tool[];
}): MCPServer {
  return {
    async serve() {
      // Minimal stdio MCP server scaffold — real impl lives in @chadlabs/core
      const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
      const { StdioServerTransport } = await import(
        "@modelcontextprotocol/sdk/server/stdio.js"
      );

      const server = new Server(
        { name: opts.name, version: opts.version },
        { capabilities: { tools: {} } }
      );

      const { ListToolsRequestSchema, CallToolRequestSchema } = await import(
        "@modelcontextprotocol/sdk/types.js"
      );

      server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: opts.tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: { type: "object" as const },
        })),
      }));

      server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const tool = opts.tools.find((t) => t.name === req.params.name);
        if (!tool) {
          return {
            content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
            isError: true,
          };
        }
        try {
          const parsed = tool.inputSchema.parse(req.params.arguments ?? {});
          return await tool.handler(parsed);
        } catch (err) {
          return {
            content: [{ type: "text", text: String(err) }],
            isError: true,
          };
        }
      });

      const transport = new StdioServerTransport();
      await server.connect(transport);
    },
  };
}

// ---- withLicenseGate -------------------------------------------------------

export function withLicenseGate<T>(handler: T, _productSlug: string): T {
  // No-op gate in shim — real impl in core checks license server
  return handler;
}

// ---- openDb ----------------------------------------------------------------

export function openDb(path: string): Database.Database {
  return new Database(path);
}

// ---- migrate ---------------------------------------------------------------

export function migrate(
  db: Database.Database,
  migrations: Migration[]
): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set<number>(
    (
      db.prepare("SELECT version FROM _migrations").all() as Array<{
        version: number;
      }>
    ).map((r) => r.version)
  );

  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  for (const m of sorted) {
    if (applied.has(m.version)) continue;
    db.exec(m.sql);
    db.prepare(
      "INSERT INTO _migrations (version, name) VALUES (?, ?)"
    ).run(m.version, m.name);
  }
}

// ---- defineExtractor -------------------------------------------------------

export function defineExtractor<T>(opts: {
  name: string;
  schema: ZodSchema<T>;
  systemPrompt: string;
}): Extractor<T> {
  // Real impl calls Anthropic API with structured output; shim throws to force
  // tests to use mockExtractor instead.
  return {
    async extract(_input: string): Promise<T> {
      throw new Error(
        `defineExtractor("${opts.name}"): live extractor called in shim — use mockExtractor in tests`
      );
    },
  };
}

// ---- mockExtractor ---------------------------------------------------------

export function mockExtractor<T>(
  opts: { name: string; schema: ZodSchema<T>; systemPrompt: string },
  fn: (input: string) => T
): Extractor<T> {
  return {
    async extract(input: string): Promise<T> {
      const raw = fn(input);
      return opts.schema.parse(raw);
    },
  };
}
