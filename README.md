# ChadLabs MCP

Vertical MCP servers for solo professionals. Shared core + per-vertical packages.

## Packages

| Package | Status | Description |
|---|---|---|
| `@chadlabs/core` | scaffolding | Shared MCP server framework: license gate, marketplace adapters, structured-extraction runtime, SQLite migration runner, privacy smoke-test harness |
| `@chadlabs/bookkeeping` | scaffolding (v1 vertical) | Email→invoice extractor, transaction classifier, client-chase draft generator. Targets bookkeepers escaping QBO. |
| `@chadlabs/legal-intake` | planned | PI intake triage: extract → conflict-check → SOL math. Targets Claude-using attorneys (PI focus). |
| `@chadlabs/n8n-handoff` | planned | Workflow → client portal generator for n8n consultants. |
| `@chadlabs/dispute-packet` | planned | Order data → Etsy/Amazon dispute evidence PDF. |

## Branding

This is Chad's personal venture, separate from CloudWarriors. No CW IP, no CW codebases referenced.

## Layout

```
chadlabs-mcp/
├── packages/
│   ├── core/                   # shared framework
│   └── bookkeeping/            # v1 vertical
├── _research/                  # market research artifacts
└── infra/                      # (planned) license-api, landing site
```

## Status

Phase 1 swarm dispatch: 2026-05-21.
- Core + bookkeeping building in parallel against placeholder interfaces.
- Legal-intake + others fan out in Phase 2 after first vertical ships.

## Personal-venture context

See `~/personal-ventures/legalmcp/` for the original LegalIntake plan (now v2).
See `_research/reddit-scan-2026-05-21.md` for the Reddit pain-point scan that prompted the bookkeeping-first pivot.
