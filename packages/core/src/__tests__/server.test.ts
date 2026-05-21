import { describe, it, expect } from "vitest";
import { z } from "zod";
import { defineMCPServer } from "../server.js";

describe("defineMCPServer", () => {
  it("returns an instance with .server and .serve", () => {
    const inst = defineMCPServer({ name: "test", version: "0.0.1", tools: [] });
    expect(inst).toHaveProperty("server");
    expect(inst).toHaveProperty("serve");
    expect(typeof inst.serve).toBe("function");
  });

  it("registering tools does not throw", () => {
    expect(() =>
      defineMCPServer({
        name: "test",
        version: "0.0.1",
        tools: [
          {
            name: "echo",
            description: "Echoes input",
            inputSchema: z.object({ text: z.string() }),
            handler: async ({ text }) => ({ content: [{ type: "text", text }] }),
          },
        ],
      })
    ).not.toThrow();
  });

  it("tools list contains expected names after registration", () => {
    const inst = defineMCPServer({
      name: "test",
      version: "0.0.1",
      tools: [
        {
          name: "tool-a",
          description: "A",
          inputSchema: z.object({ x: z.number() }),
          handler: async () => ({ content: [{ type: "text", text: "ok" }] }),
        },
        {
          name: "tool-b",
          description: "B",
          inputSchema: z.object({ y: z.string() }),
          handler: async () => ({ content: [{ type: "text", text: "ok" }] }),
        },
      ],
    });
    // McpServer exposes _registeredTools on the internal server object
    const toolNames = Object.keys((inst.server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools ?? {});
    expect(toolNames).toContain("tool-a");
    expect(toolNames).toContain("tool-b");
  });
});
