# ChadLabs MCP

Vertical MCP servers for solo professionals. Shared `@chadlabs/core` framework + per-vertical packages.

**Architectural principle:** the host LLM does the inference. Our servers ship Tools, Prompts,
and Resources — and make zero outbound LLM calls. Bring your own model (Claude Desktop, Goose,
Cursor, Codex, Continue + Ollama, LM Studio…). No marketplace markup on tokens.

## Packages

| Package | Status | Description |
|---|---|---|
| [`@chadlabs/core`](packages/core/README.md) | v0.1, alpha | Shared MCP framework: `defineMCPServer(Tools, Prompts, Resources)`, license gate, marketplace adapters, SQLite migration runner |
| [`@chadlabs/bookkeeping`](packages/bookkeeping/README.md) | v0.1, pre-launch | 3 Tools + 3 Prompts + 1 Resource for solo bookkeepers. invoice_extract / txn_classify / chase_draft. Cross-host eval: 90/100/100/80% on invoice fields, 100% on txn classification (OpenRouter claude-sonnet-4.5, 10 + 20 fixtures). |
| `@chadlabs/legal-intake` | planned | PI intake triage: extract → conflict-check → SOL math. Targets Claude-using attorneys. |
| `@chadlabs/n8n-handoff` | planned | Workflow → client portal generator for n8n consultants. |
| `@chadlabs/dispute-packet` | planned | Order data → Etsy/Amazon dispute evidence PDF. |

## Layout

```
chadlabs-mcp/
├── packages/
│   ├── core/                   # shared framework
│   └── bookkeeping/            # v1 vertical
│       ├── src/                # tools, prompts, resources, db
│       ├── bin/                # cli.ts, eval.ts
│       ├── eval/               # cross-host evaluation harness
│       └── benchmarks/         # generated eval reports
├── infra/
│   └── landing/                # bookkeeping.chadacus.dev static site + Traefik compose
├── _research/                  # market research artifacts (Reddit scan, marketer-agent idea)
├── LAUNCH-PRE-MERGE-GATES.md   # what has to be true before each marketplace push
└── LICENSE                     # MIT
```

## Quickstart (bookkeeping)

```bash
# install + scaffold local DB
npx -y @chadlabs/bookkeeping init

# print Claude Desktop / Goose config snippets
npx -y @chadlabs/bookkeeping doctor

# (optional) cross-host quality eval — uses your own API key
ANTHROPIC_API_KEY=sk-...  pnpm --filter @chadlabs/bookkeeping eval both anthropic
OPENROUTER_API_KEY=sk-... pnpm --filter @chadlabs/bookkeeping eval both openrouter
OLLAMA_HOST=http://localhost:11434 pnpm --filter @chadlabs/bookkeeping eval both ollama llama3.3
```

## Why "bring your own model"

- **No token markup.** Marketplaces charge for the MCP, not for inference. You pay Anthropic / OpenAI / OpenRouter (or zero, if local) directly.
- **No vendor lock-in.** Switch hosts without re-buying the tool. The same MCP works whether you use Claude Desktop today and Goose+Ollama next quarter.
- **Privacy by construction.** The server has no LLM API keys to leak. Your AI host already mediates that boundary; we don't duplicate it.
- **Smaller surface.** No retry/backoff/rate-limit machinery, no model-version drift inside our package. The host owns inference; we own the data and the prompts.

## Cross-host evaluation

Run `pnpm --filter @chadlabs/bookkeeping eval both <provider> [model]` against any of:
`anthropic`, `openai`, `openrouter`, `ollama`, `lmstudio`. Reports land in
`packages/bookkeeping/benchmarks/{invoice,txn}-classify-cross-host.md` with per-field
accuracy, latency, token counts, and a per-fixture failure breakdown.

## Branding

Chad's personal venture, separate from CloudWarriors. No CW IP, no CW codebases referenced.

## License

[MIT](LICENSE).
