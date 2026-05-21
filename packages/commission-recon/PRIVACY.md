# Privacy & data flow — `@chadlabs/commission-recon`

## Plain English

Commission statements often contain account numbers, policy numbers, member identifiers, and dollar amounts. **None of that passes through our server** — the server makes zero outbound LLM calls. The host LLM (Claude Desktop, Goose, Cursor, etc.) handles all inference using your keys.

## What we DO store

Local SQLite at `~/.chadlabs/commission-recon/db.sqlite`:

- **`commission_rows`** — carrier, statement period, policy number, premium, commission amount, transaction type. Idempotent by `raw_fingerprint` (sha256 of the normalized statement text).
- **`discrepancy_log`** — policy number, carrier, period, expected vs actual commission, status, notes.
- **`carriers`** — top-10 carrier lookup table (no client data).

The host LLM decides what to pass into these tools. Don't pass SSNs; the schema doesn't ask for them.

## What we DO NOT do

- We never call an LLM provider.
- We never read the SQLite file from off your machine.
- We have no telemetry, no crash reporting, no anonymous-usage opt-in.

## Verify

```bash
pnpm --filter @chadlabs/commission-recon smoke:network
# expected: zero outbound network attempts

rg 'fetch\(|http\.request|https\.request|axios' packages/commission-recon/src
# expected: no matches
```
