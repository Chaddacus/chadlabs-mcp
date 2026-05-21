# @chadlabs/core

Shared MCP framework for vertical packages in the ChadLabs monorepo. **No LLM calls.** The MCP server is a thin façade over `@modelcontextprotocol/sdk` that registers deterministic tools, prompts, and resources for any host LLM to consume.

## Design principle

**The host runs the LLM. We don't.**

Verticals (bookkeeping, legal-intake, n8n-handoff, etc.) ship:
- **Prompts** — engineered system prompts with JSON output schemas. Host loads them, runs them against its own model.
- **Resources** — read-only reference data (chart of accounts, statute tables, fuzzy match indexes). Host loads them as context.
- **Tools** — deterministic operations on local state (SQLite lookups, fuzzy match, log writes). The server does the work; never calls an LLM.

This buys us:
- **Bring your own LLM.** Claude / GPT / Llama via Ollama — host's choice.
- **Zero outbound LLM calls from our packages.** Strongest possible privacy story.
- **Zero provider lock-in or API-key juggling.** Users use what they already use.

## What's in here

| Module | Exports | Purpose |
|---|---|---|
| `server` | `defineMCPServer`, `Tool`, `Prompt`, `Resource`, types | Factory that registers tools/prompts/resources with the MCP SDK |
| `license` | `checkLicense`, `withLicenseGate`, `LicenseResult` | Dev / paid-key license gate; wrap handlers with `withLicenseGate` |
| `db` | `openDb`, `migrate`, `Migration` | better-sqlite3 + idempotent migration runner |
| `marketplace` | `adapters` (apify, mcpize, agensi, xpay), `MarketplaceAdapter` | Marketplace metadata + purchase URL adapters |
| `privacy` | `recordNetworkActivity`, `assertOnlyAnthropicAPI` | Privacy smoke-test interface (v1 stub; real network capture in v2) |

## Usage from a vertical package

```ts
import {
  defineMCPServer,
  withLicenseGate,
  openDb,
  migrate,
  type Tool,
  type Prompt,
  type Resource,
} from "@chadlabs/core";
import { z } from "zod";

const myTool: Tool<{ name: string }> = {
  name: "lookup_thing",
  description: "...",
  inputSchema: z.object({ name: z.string() }),
  handler: withLicenseGate(async (args) => {
    // deterministic operation only — no LLM calls
    return { content: [{ type: "text", text: "..." }] };
  }, "my-product-slug"),
};

const myPrompt: Prompt = {
  name: "do_thing",
  description: "...",
  arguments: [{ name: "input", description: "...", required: true }],
  render(args) {
    return {
      messages: [
        { role: "user", content: { type: "text", text: SYSTEM_PROMPT } },
        { role: "user", content: { type: "text", text: args["input"] ?? "" } },
      ],
    };
  },
};

const myResource: Resource = {
  uri: "myproduct://reference-data",
  name: "Reference data",
  description: "...",
  mimeType: "text/markdown",
  async read() {
    return REFERENCE_MARKDOWN;
  },
};

const server = defineMCPServer({
  name: "my-product",
  version: "1.0.0",
  tools: [myTool as Tool],
  prompts: [myPrompt],
  resources: [myResource],
});

await server.serve();
```

## Environment variables

| Variable | Purpose |
|---|---|
| `CHADLABS_DEV_MODE=1` | Bypass license check (development only) |
| `CHADLABS_LICENSE_KEY` | License key matching `/^CL-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/` |

**Notably absent:** any LLM API key. Core doesn't call LLMs.

## Testing

```bash
pnpm --filter @chadlabs/core test       # 21 tests
pnpm --filter @chadlabs/core typecheck
pnpm --filter @chadlabs/core build
```
