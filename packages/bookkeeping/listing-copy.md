# Listing copy — @chadlabs/bookkeeping

Drafts for marketplace listings. Adapt per platform (Apify, MCPize, Agensi, xpay).

---

## Short tagline (60 chars)

> Bookkeeping triage in Claude — escape QBO, $29/mo.

## Medium description (~300 chars)

> Three-tool MCP for bookkeepers: extract invoices from email bodies, classify uncategorized transactions with confidence, auto-draft client chase emails. Local SQLite, runs in Claude Desktop, no QBO/Xero subscription required. $29/mo or $0.29/operation.

## Long description (Apify-shaped)

> **BookkeepingMCP — the QBO escape valve for solo bookkeepers and small practices.**
>
> Your job has become managing noise: chasing receipts, decoding three-week-old transactions, separating personal from business. QBO is a wall of dropdowns. Karbon is $79/mo. You don't need a full practice management suite — you need the noise-reduction layer.
>
> BookkeepingMCP ships as a three-tool MCP server that runs in Claude Desktop:
>
> - **`invoice_extract`** — paste an email body, get back vendor, amount, due date, line items, and a suggested chart-of-accounts category. 12 typed fields, structured JSON.
> - **`txn_classify`** — feed it a batch of bank or credit card transactions plus your known vendors. Get back categorized output with confidence scores and one-sentence reasoning per txn.
> - **`chase_draft`** — give it a client + transactions with missing receipts/categories/memos and a tone (friendly / firm / neutral). Get back a send-ready email in markdown and plain text.
>
> **Why this and not Clio / QBO / Karbon?**
> - $29/mo flat, no per-seat creep, no 18-month contract.
> - Runs locally — your client data never touches a third-party server.
> - Works inside Claude Desktop, where you're already drafting and triaging.
> - Composable with everything else in your Claude workflow.
>
> **What it's NOT.** This is not a full practice management suite. No invoicing, no e-signature, no time tracking, no payment collection. If you need those, keep your current tools and add this for the noise-reduction tier you don't have.
>
> **Install** in 5 minutes with `npx @chadlabs/bookkeeping init`. Works on macOS, Linux, Windows.
>
> Built by a former QBO refugee who watched bookkeepers rage-quit in r/Bookkeeping all month.

## Keywords / tags

bookkeeping, accounting, QBO alternative, Xero alternative, MCP, Claude Desktop, invoice extraction, transaction classification, expense categorization, small business, solo bookkeeper, accountant tools, chart of accounts, client chase

## Screenshot brief (for marketplace gallery)

1. **Claude Desktop screenshot** — sidebar shows BookkeepingMCP connected; main pane shows a chat where Claude is calling `invoice_extract` on a pasted email and returning the structured matter sheet.
2. **JSON output close-up** — pretty-printed 12-field invoice extract for a real-world-shaped fixture (Anthropic API receipt fixture is a good one).
3. **Transaction classification** — table view of 20 classified transactions with categories, confidence, reasoning.
4. **Chase email draft** — markdown rendering of a chase email Claude produced.
5. **Privacy diagram** — "Your machine → Anthropic API → Your machine." No third-party SaaS box.

## FAQ

**Does it integrate with QuickBooks?**
Not v1. Export structured JSON, paste into QBO manually. v2 will add Clio / QBO write-back at a higher tier.

**Does it work for accountants doing multi-client books?**
v1 is single-tenant. Spin up a separate SQLite by changing the install path: `CHADLABS_DB_PATH=~/.chadlabs/bookkeeping-clientA/db.sqlite npx @chadlabs/bookkeeping init`. v2 will ship a "firm pack" with proper multi-client.

**Can I run it without Claude Desktop?**
The MCP protocol is open. Any MCP client works (Continue.dev, Cursor, etc). Claude Desktop is the easiest path.

**What happens if you stop maintaining it?**
The MCP server is a standalone Node package. Your data is in a local SQLite. Worst case, you keep using the version you have until you replace it.

**Refund policy?**
30 days, no questions, via Apify (or whichever marketplace you bought from).

## Pricing positioning

| Plan | Price | Where |
|---|---|---|
| Free trial | $0 / 14 days | Apify trial flow |
| Subscription | $29/mo | Apify (primary), MCPize, Agensi |
| Pay-per-use | $0.29/operation | xpay (catches "let me try" buyers) |
| Dev | $0 | `CHADLABS_DEV_MODE=1` for development/testing |

## Outreach templates

### r/Bookkeeping (v2 channel — after first proof)

**Title:** I built a Claude Desktop tool that does the QBO triage you hate. Looking for 3 bookkeepers to use it free for 30 days.

**Body:**
> Built this after reading the same "I'm done with QBO" threads in here for a year. It's a $29/mo Claude Desktop tool that does three things bookkeepers told me were the worst parts:
>
> 1. Pulls structured invoice data out of email bodies
> 2. Classifies uncategorized transactions with confidence + reasoning
> 3. Drafts client-chase emails for missing receipts
>
> Local SQLite, runs on your machine, no third-party server sees client data. Loom demo: [link].
>
> Looking for 3 working bookkeepers willing to try it on real intake/email/txn data for 30 days, free, in exchange for honest feedback about what works and what's missing. If interested, DM me what kind of practice you run and I'll send the install steps + a free license.

### r/ClaudeAI (v1 channel — current target)

**Title:** Show HN-style: BookkeepingMCP for Claude Desktop — 3 tools, $29/mo or $0.29/call

**Body:**
> Three tools for anyone who handles bookkeeping inside Claude — your own business, side gigs, or clients:
> - `invoice_extract`: email body → 12-field invoice JSON (vendor, amount, due, line items, category)
> - `txn_classify`: transaction list → categorized w/ confidence + reasoning
> - `chase_draft`: missing-receipt followups → send-ready markdown/plain email
>
> 50 unit tests, mock benchmarks 95%+ on field accuracy, real-API benchmark gated on `ANTHROPIC_API_KEY` env. Local SQLite, no SaaS server.
>
> Install: `npx @chadlabs/bookkeeping init` then add the snippet to your Claude Desktop config. Loom: [link]. Source: [link].

### Cold DM template (to active r/Bookkeeping posters)

> Hey [name] — saw your post about [QBO pain]. Built a $29/mo MCP for Claude Desktop that handles [specific pain]. Looking for 3 bookkeepers to use it free for 30 days in exchange for honest feedback. Loom demo: [link]. Up for it?
