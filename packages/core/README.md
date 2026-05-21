# @chadlabs/core

Shared MCP framework for vertical packages in the ChadLabs monorepo.

## What's in here

| Module | Exports | Purpose |
|---|---|---|
| `server` | `defineMCPServer`, `Tool`, `MCPServerInstance` | Stdio MCP server factory |
| `license` | `checkLicense`, `withLicenseGate`, `LicenseResult` | Dev / paid-key license gate; wrap handlers with `withLicenseGate` |
| `db` | `openDb`, `migrate`, `Migration` | better-sqlite3 + idempotent migration runner |
| `extract` | `defineExtractor`, `mockExtractor`, `Extractor` | Anthropic-API-backed structured extraction; mock variant for tests |
| `marketplace` | `adapters` (apify, mcpize, agensi, xpay), `MarketplaceAdapter` | Marketplace metadata + purchase URL adapters |
| `privacy` | `recordNetworkActivity`, `assertOnlyAnthropicAPI` | Privacy smoke-test interface (v1 stub; real network capture in v2) |

## Usage from a vertical package

```ts
import {
  defineMCPServer,
  withLicenseGate,
  openDb,
  migrate,
  defineExtractor,
} from "@chadlabs/core";

const myTool: Tool<{ foo: string }> = {
  name: "my_tool",
  description: "...",
  inputSchema: z.object({ foo: z.string() }),
  handler: withLicenseGate(async (args) => {
    // your tool logic
    return { content: [{ type: "text", text: "..." }] };
  }, "my-product-slug"),
};

const server = defineMCPServer({
  name: "my-product",
  version: "1.0.0",
  tools: [myTool as Tool],
});

await server.serve();
```

## Environment variables

| Variable | Purpose |
|---|---|
| `CHADLABS_DEV_MODE=1` | Bypass license check (development only) |
| `CHADLABS_LICENSE_KEY` | License key matching `/^CL-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/` |
| `ANTHROPIC_API_KEY` | Required for `defineExtractor` to call Anthropic API |

## Testing

```bash
pnpm --filter @chadlabs/core test       # 24 tests, no API spend
pnpm --filter @chadlabs/core typecheck
pnpm --filter @chadlabs/core build
```
