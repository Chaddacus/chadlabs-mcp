# @chadlabs/bookkeeping

Bookkeeping MCP for Claude Desktop. The QBO escape valve — triage email-buried invoices, classify uncategorized transactions, and draft client-chase emails from inside Claude.

**Status:** v0.0.0 — pre-launch. Mock benchmarks pass; real-API benchmarks + 3-bookkeeper beta pending.

## What it does

Three MCP tools, callable from Claude Desktop:

| Tool | Input | Output |
|---|---|---|
| `invoice_extract` | Email body (and optional sender/subject) | 12-field invoice JSON: vendor, amount, due date, line items, suggested expense category, confidence |
| `txn_classify` | Bank/card transactions + optional known-vendor hints | Per-txn category + confidence + reason |
| `chase_draft` | Client + transactions with missing info | Email subject + markdown body + plain body |

All processing happens locally in your Claude Desktop session. No third-party SaaS server sees your client data.

## Pricing

| Channel | Price | Model |
|---|---|---|
| Apify (primary) | $29/mo | Subscription |
| MCPize | $29/mo | Subscription |
| Agensi | $29/mo | Subscription |
| xpay | $0.29/operation | Pay-per-call |

Dev mode is free (`CHADLABS_DEV_MODE=1`).

## Install

See [INSTALL.md](./INSTALL.md) for the 5-minute Claude Desktop setup.

## Privacy

See [PRIVACY.md](./PRIVACY.md). Local SQLite, no outbound network calls except `api.anthropic.com`.

## Architecture

- TypeScript 5.4, ESM, Node 20+
- Built on `@chadlabs/core` (MCP server framework, license gate, SQLite migrations, structured extraction)
- `better-sqlite3` for local storage at `~/.chadlabs/bookkeeping/db.sqlite`
- `@modelcontextprotocol/sdk` for the MCP protocol

## Testing

```bash
pnpm --filter @chadlabs/bookkeeping test       # 50 tests, all mocked, no API spend
pnpm --filter @chadlabs/bookkeeping typecheck
pnpm --filter @chadlabs/bookkeeping build
```

## Benchmarks

```bash
pnpm --filter @chadlabs/bookkeeping bench       # mock-mode, validates the harness
ANTHROPIC_API_KEY=sk-... pnpm --filter @chadlabs/bookkeeping bench:real
```

Reports land in `benchmarks/`.

## Launch gates

See [LAUNCH-PRE-MERGE-GATES.md](../../LAUNCH-PRE-MERGE-GATES.md) at the repo root for what's required before public launch.
