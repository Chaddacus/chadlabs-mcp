# Launch pre-merge gates — @chadlabs/bookkeeping

Items required before public launch. Most are Chad-only manual steps because they need a real browser, a real human, real money, or a real account.

Status legend: ✅ done / ❌ blocked / 🟡 in progress / ⬜ not started

## Gates

### Technical (in this repo)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `@chadlabs/core` typecheck + tests pass | ✅ | code | 24/24 tests, commit `6410c08` |
| `@chadlabs/bookkeeping` typecheck + tests pass | ✅ | code | 50/50 tests after corpus expansion |
| Mock benchmark passes thresholds | ✅ | code | 19-20/20 invoice fields, 100/100 txns (mock) |
| Real-API benchmark on full corpus | ⬜ | Chad + key | Run `ANTHROPIC_API_KEY=sk-... pnpm --filter @chadlabs/bookkeeping bench:real`. Hard-gate: critical-field thresholds in `validation.md` must pass. |
| Privacy smoke test (`tcpdump`) | ⬜ | Chad | Confirm zero outbound traffic except `api.anthropic.com` during a full tool call cycle. |
| npm publish dry-run | ⬜ | Chad | `npm pack` + verify the tarball contents and `bin` entries. |

### Truth-layer (`~/.claude/state/product_truth/`)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `bookkeeping-mcp.json` exists + gate-passing | ✅ | code | Written by product-orchestrator, gate ok=true |
| Truth-layer claim c1 (invoice accuracy) → real evidence | ⬜ | Chad | Replace `proof_pending` with hash of `benchmarks/invoice-extract-accuracy.md` after real-API run |
| Truth-layer claim c2 (txn accuracy) → real evidence | ⬜ | Chad | Same for `benchmarks/txn-classify-accuracy.md` |
| Truth-layer claim c3 (chase draft quality) → real evidence | ⬜ | Chad | 3-bookkeeper beta with structured exit interview |
| Truth-layer claim c4 (install ≤ 5 min) → real evidence | ⬜ | Chad | Loom recording on a fresh Claude Desktop install |
| Truth-layer claim c5 (marketplace listings live) → real evidence | ⬜ | Chad | Screenshots of live Apify / MCPize / Agensi / xpay listings |
| Truth-layer claim c6 (data locality) → real evidence | ⬜ | Chad | Architecture diagram + `tcpdump` capture in `specs/data-locality.md` |

### Distribution (manual, Chad-only)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Read Apify ToS for regulated-vertical clauses | ⬜ | Chad | In real browser; search "legal advice," "regulated," "professional," "indemnif," "training data" |
| Read MCPize ToS | ⬜ | Chad | Same. |
| Read Agensi ToS | ⬜ | Chad | Same. |
| Read xpay ToS | ⬜ | Chad | Same. |
| ToS audit summary written to `_research/tos-audit-2026-05.md` | ⬜ | Chad | Score-card across the 4 platforms. |
| Apify creator account created | ⬜ | Chad | Primary billing rail. |
| MCPize creator account created | ⬜ | Chad | Cross-list. |
| Agensi creator account created | ⬜ | Chad | Cross-list. |
| xpay creator account created | ⬜ | Chad | Usage-rail cross-list. |
| Pricing approved by Chad | ⬜ | Chad | $29/mo flat, $0.29/op usage. Confirm or change. |
| Free trial / first-10-free decision | ⬜ | Chad | Default: first 10 attorneys / bookkeepers free for 30 days in exchange for testimonial. |

### Marketing artifacts (mostly Chad-only)

| Gate | Status | Owner | Notes |
|---|---|---|---|
| `legalmcp.io`-style landing page | ⬜ | Chad or code | One-page site with Loom + "Buy on Apify" CTA. Domain: TBD. |
| Loom demo recording | ⬜ | Chad | 5-min install walkthrough on fresh Claude Desktop. |
| Screenshots for marketplace galleries (5 shots) | ⬜ | Chad | See `listing-copy.md` § "Screenshot brief". |
| r/Bookkeeping launch post drafted | ✅ | code | In `listing-copy.md` § Outreach templates. |
| r/ClaudeAI launch post drafted | ✅ | code | In `listing-copy.md` § Outreach templates. |
| Cold-DM template drafted | ✅ | code | In `listing-copy.md` § Outreach templates. |
| List of 5 r/Bookkeeping power-user targets for DMs | ⬜ | Chad | Search r/Bookkeeping for recent QBO-rage posts; collect handles. |

### Beta

| Gate | Status | Owner | Notes |
|---|---|---|---|
| 3 bookkeepers recruited | ⬜ | Chad | Free 30-day in exchange for structured feedback. |
| Beta feedback form drafted | ⬜ | Chad or code | Google Form or Markdown template. |
| Day-14 exit interview script | ⬜ | Chad or code | "Would you pay $29/mo today? If no, what's missing?" |

### Identity / brand

| Gate | Status | Owner | Notes |
|---|---|---|---|
| Real name vs pseudonym on listings | ⬜ | Chad | Recommendation: real name + "AI engineer who watched bookkeepers rage-quit QBO" framing. |
| GitHub repo public / private | ⬜ | Chad | Recommendation: public for credibility, paywall the SOL-table-equivalent moat features at the package level. |
| `legalmcp.io` / domain registered | ⬜ | Chad | Or use `chadlabs.io` / similar. |

## Kill criteria (post-launch, 30 days)

Per `~/personal-ventures/legalmcp/validation.md` (carried over to bookkeeping vertical):

ALL of the following at day 30 = kill the vertical (not the engine):
- Marketplace page views < 100 unique
- 0 paid trials
- 0 of 5 targeted DMs converted to demo
- Reddit/HN post < 10 upvotes, no link-asks

ONE red, rest green = distribution problem, change channel. ALL red = port the engine to a different vertical (real-estate, HR intake, e-com ops).

## Next action

Pick one:
1. Run the real-API benchmark with your `ANTHROPIC_API_KEY` (the most actionable engineering gate).
2. Sit down with the ToS-audit task — 30 min of real-browser reading across 4 marketplaces.
3. Record the Loom — fresh Claude Desktop install + invoice extract demo + chase email demo. ~10 min.

The fastest path to a customer is (2) → (3) → first listing live → first DM sent. Engineering gates can land in parallel.
