# Listing copy — @chadlabs/bookkeeping

Drafts for marketplace listings. Adapt per platform (Apify, MCPize, Agensi, xpay).

---

## Short tagline (60 chars)

> Bookkeeping for any LLM — local, $29/mo, bring your own model.

## Medium description (~300 chars)

> Bookkeeping MCP for any host (Claude Desktop, Goose, Cursor, Codex, local Ollama). Three engineered prompts + chart of accounts + local vendor index. Your host's LLM does inference; we ship zero outbound LLM calls. $29/mo or $0.29/operation. Privacy-first by architecture, not just policy.

## Long description

> **BookkeepingMCP — the QBO escape valve. Works with any host LLM.**
>
> Your job has become managing noise: chasing receipts, decoding three-week-old transactions, separating personal from business. QBO is a wall of dropdowns. Karbon is $79/mo. You don't need a full practice management suite — you need the noise-reduction layer.
>
> **What it is:** an MCP server that ships three engineered prompts, a curated chart of accounts, and a local SQLite vendor index. Your existing host (Claude Desktop / Goose / Cursor / local Ollama via Continue / any MCP client) drives the actual extraction with whichever LLM you already use. We don't run a server. We don't make outbound LLM calls. Your data stays exactly where you put it.
>
> **The three prompts:**
> - **`invoice_extract`** — paste an invoice email, get 12 typed fields back: vendor, amount, due date, line items, suggested expense category, confidence, notes.
> - **`txn_classify`** — feed a batch of bank/card transactions plus known-vendor hints. Get categorized output with per-row confidence and one-sentence reasoning.
> - **`chase_draft`** — client + transactions with missing receipts/categories/memos + tone (friendly/firm/neutral) → send-ready email in markdown and plain text.
>
> **Plus 3 deterministic tools** for local state: vendor lookup (Jaro-Winkler fuzzy), vendor remember (train the index), chase-log record (audit trail).
>
> **Why this and not Clio / QBO / Karbon:**
> - $29/mo flat. No per-seat creep, no 18-month contract.
> - Runs in whatever you already use. Claude Desktop, Goose, Cursor — any MCP host.
> - **Bring your own LLM.** Claude / GPT / Llama via Ollama / your call. Local models = $0 marginal cost per extraction.
> - **Local-only by architecture.** We make zero outbound network calls. Verifiable with `lsof` / `ss`.
> - Composable with the rest of your Claude/Goose workflow.
>
> **What it's NOT.** Not a full practice management suite. No invoicing, no e-signature, no time tracking, no payment collection. If you need those, keep your current tools and add this for the noise-reduction tier you don't have.
>
> **Install** in 5 minutes with `npx @chadlabs/bookkeeping init`. Works on macOS, Linux, Windows.

## Keywords / tags

bookkeeping, accounting, QBO alternative, Xero alternative, MCP, Claude Desktop, Goose, Cursor, local LLM, Ollama, invoice extraction, transaction classification, expense categorization, chart of accounts, small business, solo bookkeeper

## Screenshot brief (for marketplace gallery)

1. **Host screenshot** — Claude Desktop sidebar shows BookkeepingMCP connected; main pane shows a chat where Claude is calling `invoice_extract` on a pasted email and returning structured JSON.
2. **Same workflow in Goose with Ollama** — visual proof of "any host, any LLM."
3. **JSON output close-up** — pretty-printed 12-field invoice extract.
4. **Transaction classification batch** — table view of classified transactions with categories + confidence + reasoning.
5. **Privacy diagram** — "Your machine → your host → your LLM → your machine. We never touch the data."

## FAQ

**Does it work with [host]?**
Any MCP-compliant host: Claude Desktop, Goose, Cursor, Continue, Codex with MCP adapter, custom clients. Tools work in every MCP host. Prompts + resources need a host that supports the full MCP spec (most modern hosts do).

**Do I need an Anthropic API key?**
No. You need an LLM connection in your host — which you already have. If your host is Claude Desktop, it uses your Anthropic subscription. If your host is Goose with Ollama, you use a local model. We don't touch your LLM credentials.

**Can I run it fully offline?**
Yes. Pair this MCP with a local-model host (Goose + Ollama, Continue + Ollama, etc.) and your data + LLM inference both stay on your machine. No network needed except the initial npx install.

**Does it integrate with QuickBooks?**
Not v1. Output is structured JSON you paste/import. v2 will add Clio / QBO write-back at a higher tier.

**Multi-client books?**
v1 is single-tenant. Run separate DBs per client: `CHADLABS_BOOKKEEPING_DB=~/.chadlabs/clientA/db.sqlite npx @chadlabs/bookkeeping init`. v2 ships proper firm-pack.

**Refund policy?**
30 days, no questions, via Apify (or wherever you bought).

## Pricing positioning

| Plan | Price | Where |
|---|---|---|
| Free trial | $0 / 14 days | Apify trial flow |
| Subscription | $29/mo | Apify (primary), MCPize, Agensi |
| Pay-per-use | $0.29/operation | xpay |
| Dev | $0 | `CHADLABS_DEV_MODE=1` |

## Outreach templates

### r/Bookkeeping post

**Title:** Built a $29/mo Claude/Goose/Cursor tool that does the QBO triage you hate. Bring your own LLM.

**Body:**
> I read the "I'm done with QBO" threads in here for a year. Built a $29/mo MCP that handles three things bookkeepers said were the worst:
>
> 1. Extracts invoice data from email bodies (12 typed fields, structured JSON)
> 2. Classifies uncategorized transactions with confidence + reasoning
> 3. Drafts client-chase emails for missing receipts/memos/categories
>
> Works in any MCP host — Claude Desktop, Goose, Cursor, even local-only setups with Ollama. **No Anthropic API key required.** Your existing LLM does the work; the MCP just ships engineered prompts + a chart of accounts + a local vendor index. **Zero outbound network calls** from the MCP itself. Verifiable with `lsof`.
>
> Loom demo: [link]. Looking for 3 working bookkeepers willing to try it on real data for 30 days, free, in exchange for honest feedback. DM me what kind of practice you run.

### r/ClaudeAI / r/LocalLLaMA post

**Title:** Show HN: BookkeepingMCP — bring-your-own-LLM bookkeeping tool. Works with Claude Desktop, Goose, Cursor, local Ollama.

**Body:**
> Three engineered prompts + chart-of-accounts resource + local vendor index + 3 deterministic tools (vendor lookup, vendor remember, chase log).
> - `invoice_extract`: email → 12-field invoice JSON
> - `txn_classify`: transactions + known vendors → categorized output
> - `chase_draft`: client + missing-info txns → send-ready email
>
> The MCP server makes **zero outbound LLM calls**. Your host model (whatever it is — Claude Sonnet, GPT-4o, Llama 3.3 via Ollama, Qwen via LM Studio) does the inference. Strong privacy story: with a local-model host, your data never leaves your machine, verifiable.
>
> 60 unit tests (no LLM calls, fully reproducible). Source: [link]. $29/mo or $0.29/op. Loom: [link].

### Cold DM template

> Hey [name] — saw your post about [QBO pain]. Built a $29/mo MCP for any LLM host (Claude Desktop, Goose, Cursor, local Ollama) that handles [specific pain]. **No API keys needed beyond what your host already has.** Looking for 3 bookkeepers to use it free for 30 days. Loom demo: [link]. Up for it?
