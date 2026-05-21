# Marketer-agent strategic write-up — 2026-05-21

Idea: autonomous marketing/sales agent with privacy.com card access, budget caps, attribution, channel allocation. Surfaces because the rate-limiter we identified in Phase 1 is **distribution**, not build.

## Architectural commitment (applies before any code)

The marketer agent follows the same host-LLM principle as the rest of ChadLabs: the agent
runtime makes ZERO outbound LLM calls. It exposes tools (treasury, channel adapters,
attribution) and prompts (ad copy, landing variants, allocation rationale). The host that
drives it — Claude Code / Codex / Goose, running on Chad's box — does the inference. This means:

- Treasury, attribution, and channel adapters are deterministic services with audit logs;
  they never depend on a particular model behaving a particular way.
- Creative generation is a Prompt (host LLM renders copy) plus a Tool (records the chosen
  variant + outcome). If the model is bad at copy this week, swap hosts; tools and budget
  caps don't change.
- Kill switches and budget caps are enforced in the Tool layer, not in the prompt — a model
  hallucinating "I should spend $5,000 on Reddit Ads" never reaches the privacy.com API
  because the Tool refuses anything above the configured cap.

When this gets productized (Shape C), the same separation lets buyers bring their own LLM.

## Three shapes

| Shape | What | Verdict |
|---|---|---|
| **A — Internal tool** | Runs marketing for ChadLabs products. You're the customer. | **Recommended v1.** |
| B — Standalone product | Sell to indie hackers / solopreneurs. | Skip — extremely crowded, trust gap is huge. |
| C — ChadLabs vertical | Productize Shape A after 6 mo of self-use. | v3. Plan toward this. |

Recommendation: build A. Plan for C in 6 months. Skip B.

## Why this is interesting for Chad specifically

- Directly solves the bandwidth ceiling identified in Phase 1 (15 humans to beta-recruit, launch cadence rate-limited by human reception).
- Privacy.com card-per-channel + spend caps + kill switches is the safety pattern Chad's coding rules already mandate ("safety in the system, not around it").
- Becomes the demo for Shape C later: "I gave it $500 and it returned $2000 in MRR." Founder-built tool with founder-attributable proof.
- ChadLabs verticals are the test bed — real conversions, real attribution, real money.

## Architecture sketch

```
packages/
├── marketer-core/         # agent loop, attribution, budget gate
├── marketer-channels/     # one adapter per channel
│   ├── reddit-ads/        # v1 first channel
│   ├── twitter-ads/       # v2
│   ├── google-search/     # v2
│   ├── meta-ads/          # v3 (high reject rate, slow approval)
│   ├── newsletter-sponsor/# v3
│   └── manual-outreach/   # drafts DMs/posts; HUMAN sends (bot DMs = bans)
├── marketer-attribution/  # UTM + landing event + Stripe/Apify webhook → conversion
├── marketer-creative/     # ad copy, landing variants, social posts, DM templates
├── marketer-treasury/     # privacy.com: card-per-channel, hard spend caps, kill switch
└── marketer-orchestrator/ # the brain: budget allocation, A/B, kill switches
```

## Autonomy tiers

- **T1 Suggest** — generates creatives, proposes allocation, human approves everything. (v0.5 dev mode)
- **T2 Operate-within-bounds** — hard cap $X/week, creates cards, runs approved creatives, kills underperformers, anomaly-pauses. **v1 target.**
- **T3 Fully autonomous** — generates new creatives, spins them up without approval, picks new channels. v3, after T2 runs 3+ months incident-free.

## The hard questions (answered)

### What does Privacy.com integration buy you?
- Per-channel virtual cards with hard spend caps (agent can't bust)
- Single-merchant locking ("Meta Ads" card only works on Meta)
- API kill switch (freeze card instantly)
- Audit log: every txn tagged with channel + campaign

### Attribution stack (the actually hard part)
- UTM params on every ad link
- Landing page sets first-party cookie with UTM source
- Sign-up event stamps source into license API DB
- Cancellation event measured 30/60/90 days → net contribution per channel
- v1 = last-touch attribution. Multi-touch is v2.

This is where most "AI marketing agents" lie — they claim attribution they don't have. ChadLabs edge: control of product + ad stack means the attribution loop is closeable.

### Which channels first?
1. **Reddit Ads** — solo bookkeepers/attorneys read niche subs, cheap CPM, hot-niche targeting, API exists.
2. **Manual outreach (drafted by agent, sent by human)** — DMs in r/Bookkeeping, r/Lawyertalk.
3. Twitter/X (build-in-public + paid).
4. Google Search Ads on long-tail intent keywords.
5. Newsletter sponsorships (Indie Hackers, AI/dev newsletters).
6. Skip v1: Meta, TikTok, LinkedIn (wrong format / wrong buyer for technical solo-pro tools).

### Budget envelope
- $20/day total across channels = $560/month max burn at v1.
- Bump to $50/day after first verified conversion.
- $200/day after 10 verified conversions.
- Compounding budget tied to verified return.

### Kill switches (multi-layer)
- Privacy.com per-card hard cap (financial primitive)
- Daily budget hard freeze (orchestrator)
- CTR floor (auto-pause if <0.3% for 24h)
- Conversion floor (auto-pause channel at $200 spend with 0 conversions)
- Anomaly alarms (refund spike, account suspension, payment failure → freeze all)
- Manual CLI override: `marketer freeze --all`

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Agent burns budget on dead channels | Medium | Privacy.com cap + conversion floor auto-pause |
| Ad platform bans account (auto-gen detected) | High | Approval gate on creatives; vary organically; cap ads/day |
| Auto-DMs trigger Reddit/X bans | High | Hard rule: drafted by agent, sent by human |
| Wrong attribution → optimizes garbage | Medium | First-party tracking + verify with Stripe/Apify customer metadata |
| Chargeback / refund risk via Privacy.com | Low | Per-card limit is the exposure cap |
| FTC ad disclosure / anti-spam compliance | Medium | Pre-flight check + static template enforcing disclosures |

## Sequencing

1. **Finish bookkeeping-mcp launch first.** No point building a marketer without a product to market.
2. **In parallel during bookkeeping launch:** scaffold `packages/marketer-treasury/` (Privacy.com) + `packages/marketer-attribution/` (UTM/conversion infra). Low-risk infra; you'll need it regardless.
3. **First channel: Reddit Ads.** Validate the full loop. T1 first week, T2 ($20/day) after one attribution cycle proves the wiring.
4. **CLI + markdown weekly reports.** No UI v1.

## What's not in scope v1

- UI / dashboard
- Multi-touch attribution
- More than one channel
- Selling to anyone but Chad
- Image / video creative generation
- TikTok / Meta / LinkedIn / podcast
- Agent-sent DMs

## Decision pending

- Promote to active when bookkeeping has first paying customer.
- If bookkeeping fails kill-criteria, marketer-agent is parked indefinitely (no product to market).
