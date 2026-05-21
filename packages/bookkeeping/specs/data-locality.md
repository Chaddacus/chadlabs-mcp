# Data locality & network proof — `@chadlabs/bookkeeping`

This document is the evidence backing **claim c6** in the product truth layer:

> *"Invoice and transaction data is processed inside the bookkeeper's local host
> session only — the MCP server makes zero outbound LLM API calls."*

The proof is **deliberately layered**: a static dependency scan, a static source
scan, and a runtime smoke test. If you don't trust the npm package, you can
re-run all three locally before installing.

## 1. Static dependency scan

`@chadlabs/bookkeeping` and `@chadlabs/core` contain **no LLM SDK in their
runtime dependency tree**:

```bash
# the SDKs we look for
LLM_SDKS=(
  "@anthropic-ai/sdk"
  "openai"
  "@google/generative-ai"
  "@google/genai"
  "@cohere-ai/cohere-ai"
  "@mistralai/mistralai"
  "@xai-org/xai"
  "ollama"
  "anthropic"
)

for sdk in "${LLM_SDKS[@]}"; do
  pnpm --filter @chadlabs/bookkeeping why "$sdk" 2>/dev/null \
    && echo "FAIL: $sdk in runtime deps"
done
```

Current dependency surface:

| Package | Runtime deps |
|---|---|
| `@chadlabs/core` | `@modelcontextprotocol/sdk`, `better-sqlite3`, `zod` |
| `@chadlabs/bookkeeping` | `@chadlabs/core`, `@modelcontextprotocol/sdk`, `better-sqlite3`, `zod` |

None of these are LLM clients. `@modelcontextprotocol/sdk` is the MCP transport;
it speaks to the *host*, never to a model provider.

## 2. Static source scan

The `eval/` directory contains provider adapters for `anthropic`, `openai`,
`openrouter`, `ollama`, `lmstudio`. **This is intentional and load-bearing:**
the cross-host evaluation harness must talk to providers to measure prompt
quality. It is a development-time tool.

The `eval/` directory is **excluded from the published npm package** via the
`files` field in `package.json`:

```json
"files": ["dist", "bin", "README.md", "INSTALL.md", "PRIVACY.md", "LICENSE"]
```

Verify after `pnpm pack`:

```bash
pnpm --filter @chadlabs/bookkeeping pack
tar -tzf chadlabs-bookkeeping-*.tgz | grep -c eval/ || echo "✓ no eval/ in tarball"
tar -tzf chadlabs-bookkeeping-*.tgz | grep -c "providers/" || echo "✓ no provider adapters in tarball"
```

The runtime source under `src/` contains zero `fetch(`, `http.request`,
`https.request`, `axios`, `node-fetch`, or `undici` calls. Verifiable:

```bash
rg -n 'fetch\(|http\.request|https\.request|axios|node-fetch|undici' \
   packages/core/src packages/bookkeeping/src
# expected: no matches
```

## 3. Runtime smoke test

`scripts/network_smoke.ts` patches `globalThis.fetch`, `http.request`, and
`https.request` to throw on call, then imports every server-side module and
renders every Prompt + the categories Resource:

```bash
pnpm --filter @chadlabs/bookkeeping smoke:network
```

Expected output:

```
✓ zero outbound network attempts across all prompts and the categories resource
  - global.fetch:        not invoked
  - http.request:        not invoked
  - https.request:       not invoked
```

This script is wired into `prepublishOnly` — a publish that introduces a
network call will fail at `npm publish` time, not in production.

## 4. Optional: mitmproxy live capture

For a paranoid third-party check, run the MCP server under mitmproxy and watch
for outbound connections during a tool invocation:

```bash
mitmweb --listen-port 8080 --mode regular &
HTTP_PROXY=http://127.0.0.1:8080 HTTPS_PROXY=http://127.0.0.1:8080 \
  npx -y @chadlabs/bookkeeping serve &

# invoke each tool via the MCP stdio interface (or via Claude Desktop with the
# bookkeeping-mcp server configured). Then inspect mitmweb's flow list.
```

Expected: zero flows captured. (The host LLM's traffic to its provider is *not*
captured here because the host runs in a separate process and uses its own
keys — that's the architectural point.)

## License-check call

The one exception we explicitly call out: **license validation**. The MCP can
optionally call a license-validation endpoint at most once per day to verify
the paid tier. This is:

- **Off by default in dev mode** (`CHADLABS_DEV_MODE=1`).
- **Cached for 24 hours** when on.
- **Never carries customer data** — payload is `{license_key}` only; response
  is `{tier, expires_at}`. No invoice content, no transactions, no client info.
- **Disclosed in PRIVACY.md** and in the `doctor` CLI output.

The license check uses `fetch(licenseServerUrl, ...)` inside `@chadlabs/core`'s
`checkLicense` function. If you cannot tolerate any outbound network at all,
running with `CHADLABS_DEV_MODE=1` keeps the server fully offline. (Marketplace
distributions ship with the license check enabled; the npm package supports
both modes via env.)

## What this proof does NOT cover

- The **host** (Claude Desktop, Goose, Cursor, etc.) makes the actual LLM call
  using its own API key. That call leaves the bookkeeper's machine; we have
  no control over it. The architectural promise is only that *our* server is
  silent — the host's network behavior is the host's contract with its user.
- A bookkeeper who pastes invoice content into a hosted model provider has,
  by definition, sent that data to the provider. The MCP's local SQLite
  vendor cache reduces repeat exposure but does not prevent the initial call.
- Telemetry / crash reporting: there is no telemetry, no crash reporting, no
  anonymous-usage opt-in. If a future version adds any, it ships disabled-by-
  default and the smoke test grows assertions accordingly.
