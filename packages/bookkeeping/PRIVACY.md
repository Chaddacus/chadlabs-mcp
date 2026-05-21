# Privacy — @chadlabs/bookkeeping

## TL;DR

**This MCP server makes zero outbound network calls.** Your bookkeeping data never leaves your machine via us. The only thing that ever sees your data is whatever LLM your host (Claude Desktop / Goose / Cursor / local Ollama) is already connected to — and that's a connection you set up, not us.

## Where your data lives

All data is local. Specifically:

- **SQLite database:** `~/.chadlabs/bookkeeping/db.sqlite` by default (override with `CHADLABS_BOOKKEEPING_DB`)
- **Tables:** vendors, chase_log, categories, _migrations
- No remote server. We don't operate one.

## Outbound network calls from this package

**Zero.** Verifiable:

```bash
# Run this MCP server with strace (Linux) or DTrace (macOS) connect events watched.
# You will see no outbound connections except localhost / DNS resolver.
```

## Where the LLM actually sees data

Your host (whatever you use — Claude Desktop, Goose, Cursor, Continue + Ollama, etc.) is the thing that calls an LLM. When you ask it to extract an invoice:

1. Host loads our prompt (no outbound from us).
2. Host loads our categories resource (no outbound from us).
3. Host calls **its own LLM connection** with the prompt + your email body.
4. Model returns JSON.
5. Host hands you the result.

The LLM sees your email body and the prompts. Whether that LLM is local (Ollama, LM Studio) or cloud (Anthropic, OpenAI, Google) is **your host's configuration**, not ours.

## With a local-model host

If your host runs a local model (Ollama, LM Studio, llama.cpp, MLX), **your data never leaves your machine**. Period.

## With a cloud-model host

If your host uses Anthropic, OpenAI, Google, etc., the standard data-handling policy of whichever provider applies. We don't introduce any additional third-party. There is no "ChadLabs Cloud" middleman.

## Privileged data

This MCP is appropriate for bookkeeping data including client invoices, transaction memos, and email drafts. Compatibility with regulatory regimes (HIPAA, attorney-client privilege thresholds, GLBA) depends on **your host's LLM connection**, not us. Confirm your host's provider's terms before processing regulated data.

## License key

`CHADLABS_LICENSE_KEY` is stored in your host's MCP config and validated locally. The current implementation checks key format only (`CL-...`); paid-key remote verification is a v2 feature. When implemented, license calls will be the **only** outbound network call this package makes, scoped to `licenses.chadacus.dev` (or equivalent) and clearly documented.

## Logs

We don't write logs to disk. We don't ship telemetry. We don't operate an error-reporting service.

## Smoke test

```bash
# macOS:
sudo lsof -i -P -n -p $(pgrep -f bookkeeping-mcp)

# Linux:
sudo ss -tnp | grep bookkeeping
```

You should see no established outbound connections. If you do, file an issue.

## Data deletion

```bash
rm -rf ~/.chadlabs/bookkeeping
```

Done. No remote state to clear.
