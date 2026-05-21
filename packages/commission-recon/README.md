# @chadlabs/commission-recon

MCP server for independent insurance brokers: reconcile carrier commission statements, flag underpayments, draft dispute emails. Runs inside Claude Desktop, Goose, Cursor, or any MCP host.

**Architectural commitment:** zero outbound LLM calls from the server. Your client policy data never passes through us — the host LLM does the inference using your keys. Read `PRIVACY.md`.

## What it does (v0.1)

- **`discrepancy_log_record`** (tool): record a commission discrepancy with status (underpaid / overpaid / missing / disputed / resolved) and auto-computed delta.
- **`dispute_email_draft`** (prompt): generate a carrier-specific dispute email with the right specificity — policy number, statement period, dollar delta, suggested attachments. Friendly or firm tone.
- **`commission-recon://carrier-formats`** (resource): top-10 US carriers' statement-format hints — header signals, format shape (tabular/two-column/narrative/grid), known quirks. Inject when classifying a low-confidence statement.

Coming in v0.2:
- `commission_statement_parse` — per-carrier extractors for the top-3 statement formats
- `expected_commission_lookup` — book-of-business diff vs carrier rate schedule
- `carrier_format_classify` — host LLM disambiguates statements that don't match any header signal

## Why $29/mo wins

- Applied / AMS360 / EZLynx all charge enterprise rates. Solo agencies still run on Excel.
- Sibling audience to `@chadlabs/bookkeeping` — same buyer (solo professional with QBO/Xero), same parse-classify-writeback shape.
- Carriers don't make this data easy to extract; that's the whole moat.

## Quickstart

```bash
npx -y @chadlabs/commission-recon init
npx -y @chadlabs/commission-recon doctor   # prints Claude Desktop + Goose snippets
```

## Status

v0.1 — alpha skeleton. 1 tool + 1 prompt + 1 resource. Carrier parsers ship in v0.2.

## License

MIT. See `LICENSE`.
