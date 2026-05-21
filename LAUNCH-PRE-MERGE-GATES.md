# Launch pre-merge gates — @chadlabs/bookkeeping

Items required before public launch. Most are Chad-only manual steps because they need a real browser, a real human, real money, or a real account.

Status legend: ✅ done / ❌ blocked / 🟡 in progress / ⬜ not started

## Architecture context

After the host-LLM refactor, this MCP makes **zero outbound LLM calls**. The host runs the LLM. Several previously-needed gates (real-API benchmark, provider abstraction, Anthropic API key in install) are obsolete and dropped.

## Gates

### Technical (in this repo)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `@chadlabs/core` typecheck + tests pass | ✅ | code | 21/21 tests after host-LLM refactor |
| `@chadlabs/bookkeeping` typecheck + tests pass | ✅ | code | 39/39 tests after refactor |
| Prompts render cleanly (`pnpm bench`) | ✅ | code | 3/3 prompts render |
| npm publish dry-run | ⬜ | Chad | `npm pack` + verify tarball contents + bin entries |
| `lsof` / `ss` zero-outbound verification | ⬜ | Chad | Confirm the locality claim while a tool call runs |

### Prompt quality (cross-host evaluation)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Multi-host prompt eval harness built | ⬜ | code (next) | Renders prompts against fixtures, sends to each host's primary model, scores extraction accuracy |
| `invoice_extract` quality on Claude Sonnet 4.5 | ⬜ | Chad + key | Target ≥90% on critical fields (vendor, amount, currency, category) |
| `invoice_extract` quality on GPT-4o | ⬜ | Chad + key | Target ≥85% |
| `invoice_extract` quality on Llama 3.3 70B (Ollama) | ⬜ | Chad + local model | Target ≥75% (advertise local-model floor honestly) |
| `txn_classify` quality on each of the above | ⬜ | Chad | Same tiering |
| Quality report published in `_research/prompt-eval-results-MM.md` | ⬜ | Chad | Public, honest, with numbers |

### Truth-layer (`~/.claude/state/product_truth/`)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `bookkeeping-mcp.json` exists + gate-passing | ✅ | code | Written by product-orchestrator |
| Truth-layer claims patched to reflect host-LLM arch | ⬜ | Chad-twin | c1/c2 should be "prompt quality across host models" not "extraction by server"; c5 should not claim Anthropic API key required |
| Truth-layer claim c6 (data locality) → real evidence | ⬜ | Chad | Now upgraded: zero outbound calls vs. just "no third-party SaaS." Verifiable. |

### Distribution (manual, Chad-only)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Read Apify ToS for regulated-vertical clauses | ⬜ | Chad | In real browser; search "legal advice," "regulated," "professional," "indemnif," "training data" |
| Read MCPize ToS | ⬜ | Chad | Same |
| Read Agensi ToS | ⬜ | Chad | Same |
| Read xpay ToS | ⬜ | Chad | Same |
| ToS audit summary written to `_research/tos-audit-2026-05.md` | ⬜ | Chad | Score-card across the 4 platforms |
| Apify creator account created | ⬜ | Chad | Primary billing rail |
| MCPize creator account created | ⬜ | Chad | Cross-list |
| Agensi creator account created | ⬜ | Chad | Cross-list |
| xpay creator account created | ⬜ | Chad | Usage-rail cross-list |
| Pricing approved by Chad | ⬜ | Chad | $29/mo flat, $0.29/op usage. Confirm or change. |
| Free trial / first-10-free decision | ⬜ | Chad | Default: first 10 bookkeepers free for 30 days for testimonials |

### Hosting / domains (Linode VPS — `*.chadacus.dev` wildcard is operational)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Landing page at `bookkeeping.chadacus.dev` | ⬜ | code or Chad | Static site with Loom + "Buy on Apify" CTA. Traefik route on existing VPS — wildcard cert already covers it. |
| (Future) `licenses.chadacus.dev` license API | ⬜ | code | v2 when self-hosted billing replaces marketplace as primary |

### Marketing artifacts

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Loom demo recording (host = Claude Desktop) | ⬜ | Chad | 5-min walkthrough: install → invoice_extract → chase_draft |
| Loom demo recording (host = Goose + Ollama, local-model story) | ⬜ | Chad | The "your data never leaves your machine" demo. Strong differentiator. |
| Screenshots for marketplace galleries (5 shots) | ⬜ | Chad | See `listing-copy.md` § "Screenshot brief" |
| r/Bookkeeping launch post drafted | ✅ | code | In `listing-copy.md` |
| r/ClaudeAI launch post drafted | ✅ | code | In `listing-copy.md` |
| r/LocalLLaMA launch post drafted | ✅ | code | In `listing-copy.md` (cross-link from r/ClaudeAI body) |
| Cold-DM template drafted | ✅ | code | In `listing-copy.md` |
| List of 5 r/Bookkeeping power-user targets for DMs | ⬜ | Chad | Search r/Bookkeeping for recent QBO-rage posts |

### Beta

| Gate | Status | Owner | Notes |
|---|---|---|---|
| 3 bookkeepers recruited | ⬜ | Chad | Free 30-day in exchange for structured feedback |
| Beta feedback form drafted | ⬜ | Chad or code | Google Form or markdown |
| Day-14 exit interview script | ⬜ | Chad | "Would you pay $29/mo today? If no, what price? If no at any price, what's missing?" |

### Identity / brand

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Real name vs pseudonym on listings | ⬜ | Chad | Recommendation: real name + "AI engineer who watched bookkeepers rage-quit QBO" |
| GitHub repo public / private | ⬜ | Chad | Recommendation: public for credibility, paywall the SOL-table-equivalent vendor index updates later if needed |
| Domain decision | ⬜ | Chad | `bookkeeping.chadacus.dev` is the free path. `chadlabs.io` etc. if you want a standalone brand. |

## Dropped gates (obsolete after host-LLM refactor)

- ❌ ~~Real-API benchmark with `ANTHROPIC_API_KEY`~~ — we don't call the API; quality is now a host-LLM evaluation, not a server benchmark
- ❌ ~~LLM provider abstraction in core~~ — no longer needed; host owns the LLM
- ❌ ~~`ANTHROPIC_API_KEY` in install env block~~ — host already has its LLM connection

## Kill criteria (post-launch, 30 days)

ALL of the following at day 30 = kill the vertical (not the engine):
- Marketplace page views < 100 unique
- 0 paid trials
- 0 of 5 targeted DMs converted to demo
- Reddit/HN post < 10 upvotes, no link-asks

ONE red, rest green = distribution problem, change channel. ALL red = port engine to a different vertical (real-estate, HR intake, e-com ops).

## Next action

Pick one:
1. **Build the multi-host prompt-eval harness** (1-2 hours of code). Then run it. Numbers in hand make all marketing copy more credible.
2. **ToS audit** — 30 min of real-browser reading across 4 marketplaces.
3. **Loom recordings** — Claude Desktop demo + Goose-with-Ollama "local model" demo. ~20 min.
4. **Deploy landing page** to `bookkeeping.chadacus.dev` via existing Traefik wildcard. ~30 min.

Fastest to first dollar: 2 → 4 → Apify listing → 3 → r/Bookkeeping post → DMs.
