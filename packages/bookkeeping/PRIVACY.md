# Privacy — @chadlabs/bookkeeping

## Where your data lives

All data is local. Specifically:

- **SQLite database:** `~/.chadlabs/bookkeeping/db.sqlite` (your machine, your filesystem, your backups)
- **Tables stored:** transactions, vendors, categories, chase log

No data leaves your machine to ChadLabs servers. We don't run a server.

## Network calls

The MCP server makes exactly one kind of outbound call: structured-output requests to the Anthropic API at `api.anthropic.com`. These calls contain:

- The system prompt for the specific tool being invoked
- The text content you pass to the tool (email body, transaction list, client info)

That's it. No analytics, no telemetry, no error-reporting service.

## What Anthropic sees

When you use the tool, Anthropic receives the request as part of normal API usage under **your** API key. Their data-handling policy applies (https://www.anthropic.com/legal/privacy). If you've enabled their commercial / no-training tier, they don't train on the request.

## Privileged data (legal / financial)

This MCP is appropriate for handling bookkeeping data including client invoices, transaction memos, and email drafts. Because the data is local + only routed to Anthropic under your API key, it's compatible with most professional confidentiality obligations.

**However:** if you handle data under specific regulatory regimes (HIPAA-covered, attorney-client privileged client data above a certain threshold, etc.), confirm your local rules permit sending the data to a third-party LLM API. ChadLabs doesn't make that determination for you.

## License key

The `CHADLABS_LICENSE_KEY` env var is sent **only** to ChadLabs license verification (when implemented for v2 paid tier). Until then it's stored in Claude Desktop's config and validated locally in dev mode.

## Logs

The MCP server does not write logs to disk by default. Claude Desktop may log its own MCP traffic for debugging.

## Smoke test

You can verify the locality claim:

```bash
# In one terminal:
sudo tcpdump -i any -nn 'host not api.anthropic.com and not 127.0.0.1' 2>&1 | grep -i bookkeeping

# In another, run a tool call through Claude Desktop.
```

If `tcpdump` shows any traffic from the bookkeeping process to a host that's not `api.anthropic.com` (other than localhost / your DNS resolver), file an issue.

## Data deletion

```bash
rm -rf ~/.chadlabs/bookkeeping
```

Done. No remote state.
