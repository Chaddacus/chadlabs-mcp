# @chadlabs/prior-auth

MCP server for healthcare prior-authorization denial appeals. Runs inside
Claude Desktop, Goose, Cursor, Codex CLI, Continue + Ollama, or any MCP host.

**Architectural commitment:** the server makes **zero outbound LLM calls**.
The host LLM does all inference using your own keys. Your patient data (PHI)
never passes through us — we don't see it, we don't store it, we don't transmit
it. The BAA / HIPAA conversation is between you and your AI host's LLM
provider, not us. Read `PRIVACY.md` for the full data-flow.

## What it does

Two Tools + two Prompts + one Resource.

- **Tools (deterministic, side-effecting):**
  - `sla_clock_check` — given a denial-received timestamp + SLA kind (standard 7-day, expedited 72-hour, post-service 30-day), return the deadline and a fresh/warning/overdue status.
  - `appeal_log_record` — audit row per appeal sent: first-level, second-level, peer-to-peer, external review. Tracks outcome (pending/overturned/upheld/partial).
- **Prompts (rendered for the host LLM):**
  - `appeal_letter_draft` — denial + clinical facts → subject + markdown body + plain body + suggested attachments + cited reason codes. Tones: friendly / clinical / legal.
  - `denial_classify` — free-text denial language → structured reason code from the canonical taxonomy.
- **Resource:**
  - `prior-auth://reason-codes` — 22-code denial-reason taxonomy spanning medical-necessity, coverage, documentation, administrative, formulary, and prior-auth-required categories. Inject this into the prompts so the host LLM cites real codes instead of inventing them.

## Why $29/mo wins

- **EHR-bolted incumbents charge $500–5K/mo per provider.** This runs inside the AI host you already pay for.
- **Bring-your-own-model.** Switch from Claude to GPT-4o to local Llama; your appeal workflow stays the same.
- **No BAA with us.** Architecturally impossible for PHI to reach our infrastructure because we don't have any LLM-call code path.

## Quickstart

```bash
npx -y @chadlabs/prior-auth init
npx -y @chadlabs/prior-auth doctor   # prints Claude Desktop + Goose config snippets
```

Paste the snippet into your host's config. Restart the host. The MCP shows up in your tool palette.

## Status

v0.1 — alpha. Two tools shipped, more coming. Cross-host eval harness lands in v0.2.

## License

MIT. See `LICENSE`.
