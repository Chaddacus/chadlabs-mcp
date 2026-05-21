import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodSchema } from "zod";

// ---- tools (deterministic; host LLM drives) --------------------------------

export type ToolHandler<T> = (
  args: T
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<T>;
  handler: ToolHandler<T>;
}

// ---- prompts (system prompts the host loads + uses with its own model) ----

export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface Prompt {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  /**
   * Render the system + user messages for the host's LLM call.
   * Pure function — no side effects.
   */
  render(args: Record<string, string>): {
    messages: Array<{
      role: "user" | "assistant";
      content: { type: "text"; text: string };
    }>;
  };
}

// ---- resources (read-only data the host loads as context) -----------------

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  /** Pure function — returns current resource contents. */
  read(): Promise<string>;
}

// ---- server ---------------------------------------------------------------

export interface MCPServerOptions {
  name: string;
  version: string;
  tools?: Tool[];
  prompts?: Prompt[];
  resources?: Resource[];
}

export interface MCPServerInstance {
  serve(): Promise<void>;
  server: McpServer;
}

export function defineMCPServer(opts: MCPServerOptions): MCPServerInstance {
  const mcp = new McpServer({ name: opts.name, version: opts.version });

  for (const tool of opts.tools ?? []) {
    const shape = (tool.inputSchema as z.ZodObject<z.ZodRawShape>).shape ?? {};
    mcp.registerTool(
      tool.name,
      { description: tool.description, inputSchema: shape },
      async (args) => {
        return tool.handler(args as unknown);
      }
    );
  }

  for (const prompt of opts.prompts ?? []) {
    const argSchema: z.ZodRawShape = {};
    for (const a of prompt.arguments ?? []) {
      const base = z.string().describe(a.description);
      argSchema[a.name] = a.required === false ? base.optional() : base;
    }
    mcp.registerPrompt(
      prompt.name,
      { description: prompt.description, argsSchema: argSchema },
      async (args) => prompt.render(args as Record<string, string>)
    );
  }

  for (const res of opts.resources ?? []) {
    mcp.registerResource(
      res.name,
      res.uri,
      {
        title: res.name,
        description: res.description,
        mimeType: res.mimeType,
      },
      async () => ({
        contents: [
          {
            uri: res.uri,
            mimeType: res.mimeType,
            text: await res.read(),
          },
        ],
      })
    );
  }

  return {
    server: mcp,
    async serve() {
      const transport = new StdioServerTransport();
      await mcp.connect(transport);
    },
  };
}
