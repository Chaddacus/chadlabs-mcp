# Phase 4 vertical picks — 2026-05-21

Two parallel deep-research agents converged. Picks below are decision-level, not exploration.

## Convergent signal

| Vertical | Agent 1 verdict | Agent 2 verdict | Synthesis |
|---|---|---|---|
| Healthcare prior-auth / denial appeals | Top pick — CMS 7-day rule + BYO-model dodges BAA | "Clearest gap" — zero provider-side MCP found, 31% YoY denial growth | **BUILD** |
| Insurance broker recon / quote-compare | Top pick — commission recon, parser-per-carrier | "Clearest gap" — broker side empty, Korint described workflow but didn't ship | **BUILD** |
| Multi-client bookkeeper cockpit | (not surfaced) | "Every QBO MCP is single-tenant; bookkeepers run 8–25 clients" | **EXTEND existing pkg** |
| Legal-intake (PI) | Reject — Harvey, Tavrn, Vector, Legalos, Wayco shipped | Reject — Harvey + General Legal + Thomson Reuters MCPs all live | Window closed |
| Recruiting / candidate-verify | Validate-but-tight (10-day window) | Reject — Greenhouse official + 175-tool community server live | Skip |
| n8n-handoff | Reject — pain is distribution not handoff | (not surfaced) | Skip |
| Dispute-packet (Etsy/Amazon) | Weak — ROI dies on chargeback fee | (not surfaced) | Skip |
| Amazon-settlement P&L | Weak — Sellerboard $15/mo eats it | (not surfaced) | Skip |

## Decision

**Build in parallel this session:**

1. **`@chadlabs/prior-auth`** (new vertical, greenfield)
   - Audience: solo specialty practices, small clinics, billing VAs working for them
   - 3 tools: `denial_reason_extract` (PDF/EOB → reason codes + payer + member), `appeal_log_record` (audit row per appeal sent), `sla_clock_check` (days remaining in CMS 7/72-hour windows)
   - 3 prompts: `appeal_letter_draft` (denial + citations → appeal letter, friendly/clinical/legal tones), `denial_classify` (free-text denial reason → CMS-0057-F reason code), `peer_to_peer_brief` (denial → 1-page brief for doc's P2P call)
   - 1 resource: `prior-auth://reason-codes` (CMS-0057-F structured denial reason taxonomy + payer-specific overlay)
   - Why $29/mo wins: incumbents are EHR-bolted enterprise ($500–5K/mo). BYO-model means PHI never leaves the host's existing AI session — the only architecture that does not need a BAA with us.
   - Why now: CMS-0057-F mandates structured denial reasons + 7-day SLA starting Jan 2026; rollout is mid-window, EHR vendors are 12 months behind.
   - Build difficulty: 2–3 weeks for full v1; 1 evening for production-shaped skeleton + cross-host eval.

2. **`@chadlabs/commission-recon`** (new vertical, greenfield)
   - Audience: independent P&C / health insurance brokers, solo agencies (1–5 producers)
   - 3 tools: `commission_statement_parse` (carrier statement PDF/CSV → row per policy), `expected_commission_lookup` (book of business + carrier rate → expected vs actual diff), `discrepancy_log_record` (audit row per unpaid/short-paid policy)
   - 2 prompts: `carrier_format_classify` (raw statement → carrier identification + format hint), `dispute_email_draft` (discrepancy → carrier-friendly dispute email)
   - 1 resource: `commission-recon://carrier-formats` (top-20 carrier statement schemas, freezable per release)
   - Why $29/mo wins: Applied/AMS360 charge enterprise rates; solo agencies still on Excel. Sibling audience to bookkeeping; same parse-classify-writeback shape.
   - Why now: direct-bill share growing; carriers shifting to digital-only statements faster than agencies can keep up.
   - Build difficulty: 2–3 weeks for top-20 carriers; 1 evening for skeleton + 3 carrier formats.

3. **`@chadlabs/bookkeeping` multi-client cockpit extension** (v0.2 of shipping package)
   - New `clients` table + migration v6 in bookkeeping db
   - New tools: `client_register` (add a client realm with display name + QBO realm id placeholder), `client_summary` (roster view: clients × unresolved txns × open chases), `month_end_status` (per-client close checklist position)
   - 1 new prompt: `monthend_narrative` (client P&L + variance → plain-English narrative for the client email)
   - Why this isn't a new package: same buyer, same DB, same install. v0.2 increases LTV without splitting the audience.
   - Dogfood-ready today: Chad has multiple business entities; can register CW + ChadLabs + ASMD + personal as 4 "clients" and use the cockpit on his own books.

## Out of scope this session

- Marketer-agent (still parked — needs distribution to matter first)
- Legal-intake (window closed)
- All other items in `_research/ideas.md`

## Adversarial calls I'm making

- **Prior-auth is a regulated vertical.** Doing it under "ChadLabs" rather than under a CW or licensed entity is fine because the MCP doesn't store PHI, doesn't transmit it, doesn't see it. The host's LLM does. But the marketing copy must NOT claim "HIPAA-compliant" — must claim "BYO-host architecture means no PHI passes through us." Different claim, different liability surface.
- **Commission-recon's parser-per-carrier surface area is a long tail.** Ship v1 with 3 carriers (UnitedHealth, Aetna, Cigna for health; or Travelers/Progressive/Liberty for P&C). Reject the temptation to write a "generic" parser. Top-3 covers ~40% of solo-agency book volume in most markets.
- **The bookkeeping cockpit must NOT require QBO API.** Solo bookkeepers manage clients OUTSIDE QBO too (clients on Xero, Wave, spreadsheets, paper). Cockpit is a metadata + roster layer; data ingestion stays paste-from-host-LLM.
- **Workers must inherit the host-LLM principle.** Both new packages: zero outbound LLM calls from the server. Network smoke test wired into prepublishOnly. Same proof-of-locality story as bookkeeping.

## Next moves (this session)

1. Spawn 2 parallel worker agents (one per new vertical, greenfield, low-conflict).
2. Personally extend bookkeeping with cockpit tools while workers run.
3. Review + integrate worker output; run cross-host eval against the new prompts.
4. Commit + push + verify CI green.
5. Update `LAUNCH-PRE-MERGE-GATES.md` to add the two new verticals, marketplace plans.

Dogfood plan (next session):
- Wire CW/ChadLabs/ASMD/personal into bookkeeping cockpit as 4 clients; actually use it to do my May 2026 books.
- Generate 20 synthetic denial fixtures + 20 commission statements (real-shaped, no PHI/identifying info); run prior-auth + commission-recon evals.
- Recruit 1 specialty-practice billing person (via DMs to r/HealthcareAdmin or warm contacts) + 1 indie insurance broker (LinkedIn / r/InsuranceProfessional) for beta.
