# Reddit pain-point scan — 2026-05-21

Scope: 19 subreddits, top-of-month (`t=month`) listings via Reddit JSON API.
Caveats: WebFetch was blocked from Reddit; used curl directly. 25-item slice per sub; not paginated. Raw data at `/tmp/reddit_scan/*.json`.

## Top 10 unmet pain points

### 1. Bookkeeping noise-management / QBO escape — **strongest fit for Chad**
- **Pain:** "Managing noise" — chase receipts, decode 3-week-old txns, separate personal/business
- **Sub:** r/Bookkeeping
- **URLs:**
  - https://www.reddit.com/r/Bookkeeping/comments/1t8ylhj/ ("less about bookkeeping itself")
  - https://www.reddit.com/r/Bookkeeping/comments/1t5c8np/ (personal-expense detection)
  - https://www.reddit.com/r/Bookkeeping/comments/1tdz2c2/ (invoice-in-email-body extraction)
  - https://www.reddit.com/r/Bookkeeping/comments/1t9urob/ (bank-rec at volume)
  - https://www.reddit.com/r/Bookkeeping/comments/1sunbmc/ (QBO "boiling point")
  - https://www.reddit.com/r/Bookkeeping/comments/1tckxoq/ (QBO Rant)
  - https://www.reddit.com/r/Bookkeeping/comments/1t7linj/ ("Goodbye QBD")
  - https://www.reddit.com/r/Bookkeeping/comments/1t0t8un/ ("going to leave QBO")
- **Why current solutions fail:** QBO/QBD in active revolt; alternatives (Karbon, FreshBooks) are full-suite $49-99+/mo
- **Wedge:** MCP-native — email→invoice extractor + txn classifier + client-chase loop

### 2. PI-attorney intake automation
- **Pain:** PI/litigation lawyers drowning in document review, discovery, and intake friction
- **Sub:** r/Lawyertalk
- **URLs:**
  - https://www.reddit.com/r/Lawyertalk/comments/1szaubo/ (PI document requests)
  - https://www.reddit.com/r/Lawyertalk/comments/1tbjlkz/ ("print/chicken-scratch/scan back" still common)
  - https://www.reddit.com/r/Lawyertalk/comments/1t2zgek/ (discovery dispute resolution)
  - https://www.reddit.com/r/Lawyertalk/comments/1t6ssgo/ (meta camera glasses consults)
- **Status:** Confirmed Chad's previous v1 pick; now deferred to v2 in favor of bookkeeping

### 3. Amazon FBA per-ASIN profitability (settlement-report parser)
- **Pain:** Sub-100-orders/day sellers priced out of Helium10/Sellerboard ($79-200+/mo)
- **Sub:** r/AmazonSeller
- **URLs:**
  - https://www.reddit.com/r/AmazonSeller/comments/1szdfgx/ (small-seller profitability tracking)
  - https://www.reddit.com/r/AmazonSeller/comments/1t5ii5l/ ("they got greedy")
- **Wedge:** Deterministic ETL + LLM for edge classification — cheap MCP wedge

### 4. Hold-time / customer-support voice agent
- **Pain:** Universal rage at hold time (insurance/healthcare/government/airlines)
- **Sub:** r/SomebodyMakeThis
- **URLs:**
  - https://www.reddit.com/r/SomebodyMakeThis/comments/1texe2r/ (sit-on-hold AI assistant)
  - https://www.reddit.com/r/SomebodyMakeThis/comments/1th9vxx/ (hold-time anger)
- **Caveat:** Consumer pricing is hard. Better as B2B voice-agent MCP for insurance brokers / clinics.

### 5. Bloated SaaS / Salesforce at 10-20 person companies
- **Pain:** Hit Salesforce price wall, "barely using half of what we pay for"
- **Sub:** r/smallbusiness
- **URL:** https://www.reddit.com/r/smallbusiness/comments/1szbjvi/
- **Wedge:** Indirect — MCP-as-thin-CRM-layer. Adjacent to Chad's strengths but switching-cost wall is real.

### 6. Recruiter ATS hygiene + fake-candidate detection
- **Pain:** Drowning in AI-fabricated resumes incl. nation-state actors
- **Sub:** r/recruiting
- **URLs:**
  - https://www.reddit.com/r/recruiting/comments/1t3jwmw/ (North Korean fake resumes)
  - https://www.reddit.com/r/recruiting/comments/1tc3dvd/ (fake candidate flood)
  - https://www.reddit.com/r/recruiting/comments/1thffga/ (sourcing burnout)
- **Wedge:** Resume-anomaly detector + identity-signal aggregator as MCP slot for any ATS

### 7. n8n consultant client-handoff
- **Pain:** No clean handoff story for built automations
- **Sub:** r/n8n
- **URLs:**
  - https://www.reddit.com/r/n8n/comments/1thyv77/ (handoff problem)
  - https://www.reddit.com/r/n8n/comments/1t7uepl/ ("MCP changed everything")
  - https://www.reddit.com/r/n8n/comments/1tf0qnx/ (SEO reporting cut 4h → 1min)
- **Wedge:** Chad's exact lane — MCP-driven client portal for n8n consultants. **Contrarian:** nobody is selling deliver-and-maintain infra to the consultants themselves.

### 8. Etsy seller fraud / dispute defense
- **Pain:** Repeatedly scammed by buyer fraud; Etsy Support non-responsive
- **Sub:** r/Etsy
- **URLs:**
  - https://www.reddit.com/r/Etsy/comments/1t7so6x/ (totally robbed)
  - https://www.reddit.com/r/Etsy/comments/1t2f4ry/ (got scammed)
  - https://www.reddit.com/r/Etsy/comments/1t7v96x/ (support is a joke)
  - https://www.reddit.com/r/Etsy/comments/1tbpfv9/ (defrauded by Etsy)
- **Wedge:** Auto-draft dispute packets from order data + tracking — cheap MCP, viral in seller subs

### 9. Therapist documentation/notes
- **Pain:** Implicit but constant; gummy-cluster-per-note thread reveals it
- **Sub:** r/therapists
- **URL:** https://www.reddit.com/r/therapists/comments/1tb7293/
- **Skip:** HIPAA + crowded (Heidi/Upheal/Mentalyc dominate)

### 10. SEO/marketing reporting automation
- **Sub:** r/n8n, r/microsaas
- **URLs:**
  - https://www.reddit.com/r/n8n/comments/1tf0qnx/
  - https://www.reddit.com/r/microsaas/comments/1t1pjl2/
- **Skip:** Commoditizing fast, many vibe-coded entrants

## Ranked for Chad

1. **Bookkeeping** — best fit. v1 pick (this Phase 1 build).
2. **PI legal intake** — confirmed but slower buyer. v2.
3. **n8n consultant handoff** — exact-lane fit, narrow audience. v2/v3.
4. **Amazon settlement-report MCP** — narrow deterministic wedge. v3.
5. **Recruiter resume-anomaly MCP** — novel angle (NK detection), narrow. v3.
6. **Etsy/Amazon dispute-packet generator** — tiny TAM, immediate ACV. v3.
7. **Hold-time voice agent (B2B)** — high build risk for 5-10 hrs/week. Park.
8. **SEO reporting** — skip, commoditized.
9. **Salesforce-replacement at 15 employees** — skip, switching-cost wall.
10. **Therapist notes** — skip, regulated + crowded.

## Contrarian bets

- **n8n consultant handoff** — everyone builds automations; nobody sells infra to the consultants
- **Etsy dispute-packet** — $19/mo, zero competition, viral in seller subs, tiny TAM but pure profit

## Coverage gaps

Didn't fetch: r/Lawyers, r/RealEstate, r/medicine, r/dentistry, r/psychotherapy, r/Twitch, r/YouTubers, r/LitRPG, r/ProgressionFantasy, r/writing, r/EntrepreneurRideAlong, r/Entrepreneur, r/ChatGPT, r/OpenAI, r/LocalLLaMA, r/AutomateUserHub. r/Construction surfaced no software pain.
