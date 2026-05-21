# Privacy & data flow — `@chadlabs/prior-auth`

## Plain English

We are NOT a HIPAA covered entity.

We do not need to be, because **PHI never passes through our server**:

- The server makes zero outbound LLM API calls. Static dependency scan + runtime smoke test (`pnpm smoke:network`) prove this; the smoke test is wired into `prepublishOnly` so a publish that introduces a network call fails before it ships.
- The host LLM (Claude Desktop, Goose, Cursor, Codex CLI, Continue + Ollama, etc.) handles all inference using **your** API keys / **your** local model.
- The BAA / HIPAA conversation is between you and your AI host's LLM provider. If you use Claude Desktop with Anthropic, your BAA is with Anthropic. If you run a local Ollama model, there is no provider — the data stays on your machine.

## What we DO store

A local SQLite database at `~/.chadlabs/prior-auth/db.sqlite` on your machine. Contents:

- **`denial_extractions`**: claim_id, payer, member_id, denial reason code, denial reason text, raw excerpt of the denial language.
- **`appeal_log`**: claim_id, payer, denial reason code, appeal sent timestamp, appeal type, outcome.
- **`payers`**: lookup table of common US payers (no patient data).

The host LLM decides what fields to pass to these tools. If you don't want a member ID in our local DB, don't include it in your tool calls — the schema permits null.

## What we DO NOT do

- We never read the SQLite file from anywhere off your machine.
- We never call an LLM provider.
- We have no telemetry, no crash reporting, no anonymous-usage opt-in.
- The optional license-validation endpoint (off by default in dev mode) sends only your license key — never claim data.

## What you should NOT do

- Do not claim "HIPAA-compliant" marketing copy on top of this tool. We do not have a BAA with you. The architectural claim is "PHI never passes through our server" — that's a different claim and it's defensible.
- Do not paste real patient PHI into a host LLM you don't have a BAA with. That's a *your-host* concern; this tool can't enforce it.

## How to verify

```bash
# Static deps: no LLM SDK in the runtime tree
pnpm --filter @chadlabs/prior-auth why @anthropic-ai/sdk || echo "✓ not in deps"
pnpm --filter @chadlabs/prior-auth why openai           || echo "✓ not in deps"

# Source scan: no fetch/http.request in our src
rg 'fetch\(|http\.request|https\.request|axios|node-fetch|undici' \
   packages/prior-auth/src && echo FAIL || echo "✓ no network calls in source"

# Runtime smoke: stub network + render every prompt + read every resource
pnpm --filter @chadlabs/prior-auth smoke:network
```
