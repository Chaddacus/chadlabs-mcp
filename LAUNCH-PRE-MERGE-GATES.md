# Launch pre-merge gates — @chadlabs/{bookkeeping,prior-auth,commission-recon}

Items required before public launch. Most are Chad-only manual steps because they need a real browser, a real human, real money, or a real account.

Status legend: ✅ done / ❌ blocked / 🟡 in progress / ⬜ not started

## Architecture context

After the host-LLM refactor, this MCP makes **zero outbound LLM calls**. The host runs the LLM. Several previously-needed gates (real-API benchmark, provider abstraction, Anthropic API key in install) are obsolete and dropped.

## Gates

### Technical (in this repo)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `@chadlabs/core` typecheck + tests pass | ✅ | code | passing (host-LLM refactor) |
| `@chadlabs/bookkeeping` typecheck + tests pass | ✅ | code | 54/54 tests (incl. eval-scorer tests) |
| Prompts render cleanly | ✅ | code | covered by prompt unit tests + eval harness |
| Network-locality smoke (`pnpm smoke:network`) | ✅ | code | claim c6 — zero fetch/http.request during full prompt + resource render |
| Static-deps scan (no LLM SDK in runtime deps) | ✅ | code | see `packages/bookkeeping/specs/data-locality.md` |
| npm publish dry-run | ⬜ | Chad | `pnpm pack` + verify tarball contents + bin entries (CI verifies `eval/` excluded automatically) |
| `lsof` / `ss` zero-outbound verification | ⬜ | Chad | Optional belt-and-suspenders on top of smoke test |

### Prompt quality (cross-host evaluation)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Multi-host prompt eval harness built | ✅ | code | `bin/eval.ts` + `eval/providers/{anthropic,openai,openrouter,ollama,lmstudio}.ts` + 10/20 fixture sets + scorer with 12 tests |
| `invoice_extract` quality on Claude Sonnet 4.5 (via OpenRouter) | ✅ | code | 90/100/100/80% across vendor/amount/currency/category — passing all thresholds (see `packages/bookkeeping/benchmarks/invoice-extract-cross-host.md`) |
| `txn_classify` quality on Claude Sonnet 4.5 (via OpenRouter) | ✅ | code | 100% top-1 on 20 fixtures (see `packages/bookkeeping/benchmarks/txn-classify-cross-host.md`) |
| `invoice_extract` + `txn_classify` quality on Anthropic direct | ⬜ | Chad + key | Set `ANTHROPIC_API_KEY` and run `pnpm eval both anthropic`; or wait for first CI eval run with secret configured |
| Quality on GPT-4o | ⬜ | Chad + key | `OPENAI_API_KEY` then `pnpm eval both openai gpt-4o-2024-11-20` |
| Quality on Llama 3.3 (Ollama) | ⬜ | Chad + local model | `OLLAMA_HOST=... pnpm eval both ollama llama3.3` — advertise local-model floor honestly |
| Cross-host CI workflow | ✅ | code | `.github/workflows/eval.yml` runs on manual dispatch or when prompts/eval change; uploads benchmarks as artifacts |

### Autonomous validation — Phase 5 (LLM-as-judge dogfood)

No human beta users available, so we validate prose outputs autonomously with a stronger model as critic. Pass threshold = 24/30 (80%) on a hand-written, fixture-specific rubric.

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `prior-auth` denial_classify eval | ✅ | code | 19/19 (100%) exact match on OpenRouter / Claude Sonnet 4.5 — `packages/prior-auth/benchmarks/denial-classify-openrouter-2026-05-21.md`. Fixtures realigned to current `FORM-` taxonomy; prompt tightened to forbid prefix translation. |
| `prior-auth` appeal_letter_draft eval | ✅ | code | 5/5 pass, mean 29.4/30 — `packages/prior-auth/benchmarks/appeal-letter-openrouter-2026-05-21.md`. 6-dimension judge (cite/specific/no-halluc/remedy/tone/schema). Self-judging bias acknowledged. |
| `commission-recon` dispute_email_draft eval | ✅ | code | 5/5 pass, mean 29.4/30 — `packages/commission-recon/benchmarks/dispute-email-openrouter-2026-05-21.md`. 6-dimension judge (nums/no-halluc/ask/tone/prof/schema). |
| `bookkeeping` cockpit end-to-end dogfood | ✅ | code | 4 synthetic clients + idempotent re-register + full 15-item checklist walk + roster join + monthend_narrative scored 29/30 — `packages/bookkeeping/benchmarks/cockpit-dogfood-2026-05-21.md`. Runs against isolated temp DB; safe to re-run. |
| Cross-model executor validation | ⬜ | Chad + key | Same evals against GPT-4o and a local Llama via OpenRouter to confirm prompts aren't Anthropic-shaped. |

### Truth-layer (`~/.claude/state/product_truth/`)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `bookkeeping-mcp.json` exists + gate-passing | ✅ | code | `ok: true` from `product_truth_check.py` |
| Truth-layer claims patched to reflect host-LLM arch | ✅ | code | c1/c2 rewired to cross-host-eval evidence; c5 no longer claims Anthropic API key; new c7 documents 3+3+1 primitives |
| Truth-layer claim c6 (data locality) → real evidence | ✅ | code | `packages/bookkeeping/specs/data-locality.md` (static deps + source scan + runtime smoke); wired into `prepublishOnly` |

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
| Landing page at `bookkeeping.chadacus.dev` | ✅ | code | Live (2026-05-21). nginx behind Traefik on linode `web` network, riding existing `*.chadacus.dev` cert. HSTS + CSP + healthz + robots.txt. Pre-launch CTA is email waitlist. |
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
| 3 bookkeepers recruited | ⬜ | Chad | Recruiting kit in `_research/beta-recruiting-kit.md` (Reddit post, DM templates, intake-form questions) |
| Beta feedback form drafted | ✅ | code | 14-day survey schema in `_research/beta-recruiting-kit.md` § "14-day feedback survey" |
| Day-14 exit interview script | ✅ | code | Q1 of the 14-day survey is the c3 evidence; pricing question is Q7 |

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

## Next action (post-Phase-2)

Code-side gates are largely closed. Remaining is identity/payment/network work only Chad can do:

1. **ToS audit** across Apify / MCPize / Agensi / xpay (~30 min real-browser).
2. **Create the 4 marketplace creator accounts** (~45 min, real Stripe payout info).
3. **`gh repo create Chaddacus/chadlabs-mcp --public`** + push (or have me do it; just say go).
4. **Loom × 2** — Claude Desktop demo + Goose+Ollama "local model" demo (~20 min). Storyboard in `_research/loom-storyboard.md` (next).
5. **Recruit 3 beta bookkeepers** using `_research/beta-recruiting-kit.md` (post + DMs).
6. **npm scope claim** + 2FA setup, then `pnpm publish` from CI or local.

Fastest to first dollar: 1 → 2 → 3 → 4 (Claude only) → Apify listing live → 5 → r/Bookkeeping post → Loom 2 → cross-list others.
