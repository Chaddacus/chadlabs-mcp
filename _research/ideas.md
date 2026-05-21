# Idea list — ChadLabs

Parked ideas. Promote to a package when previous vertical proves out and bandwidth permits.

## Architectural ground rules (apply to every vertical)

- **Host-LLM principle.** The MCP server itself makes ZERO outbound LLM calls. Every vertical
  ships Tools (deterministic, side-effecting), Prompts (rendered string + JSON-schema contract),
  and Resources (static reference data) — the host LLM does the inference. This is the load-bearing
  product decision: no token markup, no model lock-in, no per-vertical retry/backoff machinery.
- **Shared core.** New verticals build on `@chadlabs/core` (license gate, marketplace adapters,
  SQLite migrations, server factory). Anything that would otherwise be vertical-specific
  infrastructure goes into core if it crosses two verticals.
- **Eval harness per vertical.** Each vertical ships an `eval` script that exercises its prompts
  against multiple host LLMs (anthropic / openai / openrouter / ollama / lmstudio) and writes
  per-field accuracy reports to `benchmarks/`. This is how we keep the "works with your model"
  claim honest.

## Active

| # | Idea | Source | Status |
|---|---|---|---|
| 0 | `@chadlabs/bookkeeping` — QBO escape MCP | Reddit scan 2026-04-23 | **v0.2 in-tree** (added multi-client cockpit: 3 new tools, 1 new prompt, 18 cockpit tests) |
| 0a | `@chadlabs/prior-auth` — healthcare denial appeals MCP | Phase-4 research 2026-05-21 | **v0.1 scaffolded** (3 tools, 2 prompts, 1 resource, 22 reason codes, 18 tests, network smoke green) |
| 0b | `@chadlabs/commission-recon` — insurance broker commission recon | Phase-4 research 2026-05-21 | **v0.1 scaffolded** (1 tool, 1 prompt, 1 resource, 10 carriers, 14 tests, network smoke green) |

## Queued (Phase 2 — after bookkeeping ships)

| # | Idea | Source | Notes |
|---|---|---|---|
| 1 | `@chadlabs/legal-intake` — PI intake triage (extract + conflict + SOL) | original v1 pick, deferred | Truth-layer exists at `~/.claude/state/product_truth/vertical-mcp-legal-intake.json`. SOL table is the moat — build the table before the code. |
| 2 | `@chadlabs/n8n-handoff` — workflow → client portal MCP | r/n8n threads on handoff pain (2026-05) | Chad's exact lane. Contrarian — everyone sells automations, nobody sells deliver-and-maintain infra to consultants. |
| 3 | `@chadlabs/dispute-packet` — Etsy/Amazon order → dispute PDF | r/Etsy / r/AmazonSeller scam threads | Tiny TAM, immediate ACV, viral in seller subs. $19/mo. Pure profit. |
| 4 | `@chadlabs/recruiter-anomaly` — resume risk-scoring + NK-actor detection | r/recruiting fake-candidate threads | Novel angle. Narrow defensible. |
| 5 | `@chadlabs/amazon-settlement` — settlement report → per-ASIN P&L | r/AmazonSeller "Helium10 got greedy" threads | Sub-$50/mo against $79+ incumbents. Deterministic ETL + LLM for edge classification. |

## Parked (interesting but deferred)

| # | Idea | Why parked |
|---|---|---|
| 6 | `chadlabs-marketer` — autonomous marketing/sales agent with privacy.com card, budget caps, attribution, channel allocation | High leverage IF it works. Build as Shape A (internal tool for ChadLabs products) NOT Shape B (product to sell). Becomes the demo: "I gave it $500, it returned $X." See `_research/marketer-agent-2026-05-21.md` for full strategic write-up. Sequence after bookkeeping launches; first channel = Reddit Ads. |
| 7 | Hold-time voice agent (B2B for insurance brokers / clinics) | High build risk for 5-10 hrs/week. Park unless voice-agent stack matures. |
| 8 | LitRPG author toolkit (series bible, continuity check) | TAM thin, no credibility anchor until Chad's writing is public. Identity-aligned, not revenue. |
| 9 | Governed agent runtime as a product | v2/v3. IP-safety vs CW narrative must precede launch. Real moat exists but slow-build. |

## Skip (with reasons)

| Idea | Why skip |
|---|---|
| Generic AI writing assistants / ChatGPT wrappers | 2-yr survival ~3%; commodity. |
| Horizontal AI chatbots, meeting note takers | Race to zero. |
| SEO/marketing reporting automation | Commoditizing fast, vibe-coded competition. |
| Salesforce-replacement at 15-employee companies | Switching-cost wall. |
| Therapist documentation/notes | HIPAA + crowded (Heidi/Upheal/Mentalyc). |
| GPT Store as primary revenue | Opaque, small share, no surface. |
| Generic "AI automation agency" | Undifferentiated; margin crushed. |
