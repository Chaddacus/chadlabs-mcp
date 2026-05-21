import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, ZodSchema } from "zod";

export type ToolHandler<T> = (args: T) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export interface Tool<T = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<T>;
  handler: ToolHandler<T>;
}

export interface MCPServerOptions {
  name: string;
  version: string;
  tools: Tool[];
}

export interface MCPServerInstance {
  serve(): Promise<void>;
  server: McpServer;
}

export function defineMCPServer(opts: MCPServerOptions): MCPServerInstance {
  const mcp = new McpServer({ name: opts.name, version: opts.version });

  for (const tool of opts.tools) {
    const shape = (tool.inputSchema as z.ZodObject<z.ZodRawShape>).shape ?? {};
    mcp.registerTool(
      tool.name,
      { description: tool.description, inputSchema: shape },
      async (args) => {
        return tool.handler(args as unknown);
      }
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
