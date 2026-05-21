# @chadlabs/bookkeeping

Bookkeeping MCP for any host LLM. The QBO escape valve — extract invoices from email, classify transactions, draft client-chase emails, all driven by whatever LLM you already use.

**Bring your own LLM.** This MCP server makes **zero outbound LLM calls**. It exposes prompts, reference data, and a local vendor index. Your host model (Claude Desktop, Goose, Cursor, Codex, Continue with a local Ollama model, custom client — anything that speaks MCP) does the inference.

**Status:** v0.0.0 — pre-launch.

## Architecture

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│  Host (Claude Desktop /      │  MCP  │  @chadlabs/bookkeeping       │
│  Goose / Cursor / Codex / … )│◀─────▶│  (this package, local-only)  │
│                              │       │                              │
│  - runs your chosen LLM      │       │  - 3 prompts                 │
│  - calls our tools           │       │  - 1 resource (categories)   │
│  - loads our prompts         │       │  - 3 tools (local SQLite)    │
│  - reads our resources       │       │  - ZERO outbound LLM calls   │
└──────────────────────────────┘       └──────────────────────────────┘
```

## What's exposed

### Prompts (host loads + runs against its own model)

| Name | Purpose |
|---|---|
| `invoice_extract` | System prompt + JSON schema for extracting 12 fields from an invoice email body (vendor, amount, due date, line items, suggested category, confidence, notes) |
| `txn_classify` | Classify a batch of bank/card transactions into chart-of-accounts categories with confidence + reasoning |
| `chase_draft` | Draft a polite client-chase email (subject + markdown body + plain body) for missing receipts / categories / memos |

### Resources (host loads as context)

| URI | Content |
|---|---|
| `bookkeeping://categories` | Standard small-business chart of accounts (~30 categories, parent/child structure) — drives consistent category names across sessions and model providers |

### Tools (deterministic; the MCP server does the work)

| Tool | What it does |
|---|---|
| `vendor_lookup` | Fuzzy match a vendor name against the local SQLite vendor index (Jaro-Winkler ≥ 0.85). Returns up to N matches with `default_category` + confidence. |
| `vendor_remember` | Upsert a vendor into the local index. Future extractions classify it consistently. |
| `chase_log_record` | Record a chase-email draft to the local SQLite chase log — one row per referenced transaction. Audit trail. |

## Typical workflow

1. You paste an invoice email into your host (Claude Desktop, etc.).
2. Host loads the `invoice_extract` prompt and `bookkeeping://categories` resource.
3. Host runs its own LLM with the rendered prompt against your email body.
4. Model returns structured invoice JSON.
5. Host calls `vendor_lookup` to enrich with existing vendor history.
6. (Optionally) host calls `vendor_remember` to learn a new vendor.

For transaction classification + chase drafting: same pattern.

## Pricing

| Channel | Price | Model |
|---|---|---|
| Apify (primary) | $29/mo | Subscription |
| MCPize | $29/mo | Subscription |
| Agensi | $29/mo | Subscription |
| xpay | $0.29/operation | Pay-per-call |

LLM cost is **separate and yours**. Pick the model: Claude / GPT / Llama via Ollama / whatever your host runs. With local Ollama, marginal cost per extraction is $0.

Dev mode is free for local testing (`CHADLABS_DEV_MODE=1`).

## Install

See [INSTALL.md](./INSTALL.md) for the 5-minute setup. No LLM API key required if your host already has one configured.

## Privacy

See [PRIVACY.md](./PRIVACY.md). With a local-model host (Ollama, LM Studio), your data **never leaves your machine**. With a cloud-model host, only the host's existing LLM connection sees the data — we don't add any extra outbound calls.

## Testing

```bash
pnpm --filter @chadlabs/bookkeeping test           # 54 unit tests, no LLM calls
pnpm --filter @chadlabs/bookkeeping typecheck
pnpm --filter @chadlabs/bookkeeping build
pnpm --filter @chadlabs/bookkeeping smoke:network  # proof of zero outbound calls (claim c6)
pnpm --filter @chadlabs/bookkeeping eval both all  # cross-host prompt eval (needs API keys in env)
```

## Architecture decision

We chose host-LLM-driven over server-LLM-driven because:

1. **Bring your own LLM** — Claude / Codex / GPT / local Ollama, your call. No provider lock-in.
2. **Zero marginal LLM cost** if you use local models. Margin is yours.
3. **Privacy** — strongest possible story. We don't make outbound LLM calls; we don't see your data; we don't ship it anywhere.
4. **Simpler code** — no provider abstraction layer, no API key juggling, no rate-limit handling. The MCP server is pure data + reference + prompts.
5. **Composability** — works inside any MCP host. Cursor, Goose, Continue, Claude Desktop, custom Codex setups — all equally first-class.

## Launch gates

See [LAUNCH-PRE-MERGE-GATES.md](../../LAUNCH-PRE-MERGE-GATES.md) at the repo root.
