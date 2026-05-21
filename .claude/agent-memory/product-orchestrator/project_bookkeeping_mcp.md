---
name: project-bookkeeping-mcp
description: BookkeepingMCP v1 product truth layer — slug, pivot context, missing proof priorities
metadata:
  type: project
---

BookkeepingMCP is Chad's v1 personal venture (NOT CloudWarriors). Truth layer scaffolded 2026-05-21 at `~/.claude/state/product_truth/bookkeeping-mcp.json`. Gate: ok=true, 6 risks (all proof_pending), 0 blocked.

**Why:** Pivoted to bookkeeping-first based on May 2026 Reddit scan of r/Bookkeeping — active QBO revolt (multiple top-of-month "Goodbye QBO" threads). The companion legal-intake file (`vertical-mcp-legal-intake.json`) is now v2.

**How to apply:** When resuming work on this product, load the truth layer JSON before auditing claims. The six proof gaps are the critical path to moving truth_score from 2 to 4+:

1. c1 — `benchmarks/invoice-extract-accuracy.md` (20-email extraction benchmark)
2. c2 — `benchmarks/txn-classify-accuracy.md` (100-txn classification benchmark)
3. c3 — `beta/chase-draft-feedback.md` (3-bookkeeper 14-day beta)
4. c4 — `artifacts/install-walkthrough.md` (Loom of fresh npx install ≤5 min)
5. c5 — `artifacts/marketplace-listings.md` (Apify + MCPize + Agensi + xpay URLs)
6. c6 — `specs/data-locality.md` (architecture diagram + mitmproxy smoke test)

Scorecard at scaffold: truth=2, differentiation=4, agent_legibility=5, human_memory=4, proof_gap_risk=high.
