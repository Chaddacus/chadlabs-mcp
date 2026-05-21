# Beta recruiting kit — bookkeeping-mcp

Drafts for the 3-bookkeeper beta. Goal: produce the evidence for **claim c3**
("3 of 3 beta bookkeepers rated chase_draft 'send-ready with minor edits or
better'").

## Adversarial notes before you post anything

- **Read the subreddit's actual rules before posting.** Most accounting subs
  (`r/Bookkeeping`, `r/Accounting`, `r/QuickBooks`) ban self-promotion outright
  except on designated promo days. I do NOT know today's rules — verify the
  pinned mod post first.
- **Don't post from a new account.** Mods auto-shadowban anyone with <60 days
  account age and no history. Post from your existing account or build karma
  on the same sub for two weeks first.
- **No marketplace URL in the first post.** Free beta only. The "Apify $29/mo"
  framing reads as a sales pitch and gets you banned.
- **Don't AI-write the actual post.** I drafted the bones below; rewrite in
  your voice. Reddit AI-detection is rough but human-voice-detection is
  ruthless. The draft uses words I'd write. Replace them with words you'd write.

## Beta program one-pager

> **What it is:** A small free-during-beta tool for solo bookkeepers and small
> practices. Three things it does today: pulls structured data out of invoice
> emails, classifies a batch of uncategorized transactions, and drafts the
> "hey, missing your receipt for X" emails you'd otherwise write by hand. Runs
> inside Claude Desktop, Goose, Cursor, or any MCP host. Bring your own model.
>
> **What I'm asking:** Use it for two weeks against your real workflow. After
> two weeks, fill in a 10-question Google Form. Slack/DM me directly if
> something's broken — I'll fix it that day.
>
> **What you get:** Free forever for beta testers (founder-tier license, no
> expiry). Your name in the launch credits if you want it. First crack at the
> next vertical (legal intake or n8n handoff).
>
> **What I won't ask:** for your client data, your QBO credentials, anything
> in writing about specific clients. The tool runs locally; I never see what
> you process through it.

Save that as `_research/beta-program-one-pager.md` and link from the landing
page when ready.

## Reddit post — "share with the community" frame

Posts well on r/Bookkeeping, r/Accounting, r/QuickBooks promo threads (Mondays
or Fridays on most), r/smallbusiness's "ask for feedback" thread.

```
Title: [Beta tester ask] I built an MCP server that drafts the
       "you didn't send me a receipt for this" emails — looking for 3 solo
       bookkeepers who want to try it

Body:

Hi. I'm Chad. I've been watching the QBO-Intuit threads here for a while.
The thing that keeps showing up in those threads isn't "I hate QBO" — it's
"I hate that 60% of my job is now chasing receipts and decoding old
transactions for clients who don't remember what they bought."

I built a small MCP server (model context protocol — runs inside Claude
Desktop, Goose, Cursor, etc.) that does three things:

1. You paste an invoice email, it returns structured JSON: vendor name,
   amount, currency, line items, suggested category from a standard chart of
   accounts, confidence score.
2. You feed it a batch of uncategorized transactions, it classifies them
   with a one-sentence reason per row.
3. You give it a client name + a list of transactions missing receipts, it
   drafts the chase email (subject + markdown body + plain body). Three
   tones: friendly, neutral, firm.

It's not a full bookkeeping suite. It's the noise-reduction layer.

The reason I'm posting here: I need 3 actual solo bookkeepers to use it for
two weeks against real work. Free, no card, no expiry, you keep the license
forever after beta. I don't get to see what you process — it's all local
SQLite and your own AI host's API key.

I'm looking for honest feedback on whether the chase-email drafts are
actually send-ready or whether they read like AI slop. That's the one thing
I can't evaluate myself.

If you're in: reply or DM. I'll send the install steps and a Google Form to
fill in at the end of two weeks.

(If a mod wants to flag this for promo violation, please DM me and I'll
delete — I checked the rules and read this as "asking for feedback" not
"selling something" but I'd rather not get the sub angry.)
```

## DM template — warm contacts (bookkeepers Chad already knows)

```
hey [name] —

quick ask. I've built a small AI tool aimed at solo bookkeepers: pulls
invoices out of email, classifies transactions, drafts client chase emails.
runs inside Claude Desktop or similar. local SQLite, your own API key,
nothing leaves your machine.

I need 3 people to try it on real work for two weeks. free forever for beta
testers. the thing I most need feedback on: are the chase emails actually
sendable or are they obviously written by a robot?

20 min total commitment over 2 weeks (install + a Google Form at the end,
plus whatever it takes to use the thing on a real client batch).

interested? no pressure either way.
```

## DM template — cold (bookkeepers who post in r/Bookkeeping about QBO pain)

Send only after they post something specific and your reply is contextual.
Generic cold DMs are bans.

```
saw your post about [specific QBO thing they mentioned]. I'm building
something adjacent — small MCP tool that runs inside Claude Desktop, does
invoice extract / transaction classify / chase-email drafts. local,
bring-your-own-model, $29/mo eventually but free for the 3 beta testers I'm
looking for.

would you want to try it against real work for two weeks? the chase-email
drafting is the part I most need someone like you to vet.

if not, no worries — and good luck with [their specific QBO thing].
```

## Beta intake — Google Form schema

Save as form questions in this order:

1. **Name** (short text)
2. **Email I should send the license to** (short text)
3. **Which AI host do you use?** (multiple choice: Claude Desktop, Goose, Cursor, Codex CLI, Continue + Ollama, LM Studio, Other / not sure)
4. **How many bookkeeping clients are you handling right now?** (1-3 / 4-10 / 11-25 / 26-50 / 50+)
5. **Which of these is your biggest weekly time sink?** (Receipt chasing / Categorization / Reconciliation / Client communication / Reporting / Other — short text)
6. **Are you currently a QBO user?** (Yes / No / Used to be / Use it alongside something else)
7. **What other tools do you use today?** (long text — Karbon, FreshBooks, Xero, Bench, etc.)
8. **Are you willing to share anonymized chase-email drafts (with client names redacted) so I can publish a "beta result" page after launch?** (Yes / No / Maybe — ask me again at the end)
9. **What time zone are you in?** (so DMs land at non-rude hours)
10. **Anything else I should know?** (long text, optional)

## 14-day feedback survey — Google Form schema (this is the c3 evidence)

Question 1 is the load-bearing one. Get clean Yes/No data for it; the rest is
qualitative.

1. **For the chase emails the tool drafted: how did you actually use them?**
   (Send-ready, sent as-is / Send-ready with minor edits (tone, name, a line) /
   Useful starting point, but I rewrote most of it / Did not send any / Did not
   try chase emails)
2. **Average minutes per chase email when using the tool vs. before?**
   (free text — "5 vs 12" etc.)
3. **For invoice extraction: what % of fields were correct on the first try?**
   (free text % — vendor, amount, currency, category)
4. **For transaction classification: roughly what % top-1 accuracy?**
   (free text %)
5. **Did the tool ever produce something embarrassing — wrong vendor name,
   wrong amount, wrong tone in a chase email?** (long text)
6. **What's the biggest thing it's missing?** (long text)
7. **Would you pay $29/mo for the version you used?** (Yes / No / Maybe with
   [free text condition])
8. **If we shipped one more feature, what should it be?** (long text)
9. **Can I quote you (with first-name-only or pseudonym) on the launch
   page?** (Yes — real name / Yes — pseudonym / Anonymous / No)
10. **Anything else?** (long text)

## Tracking

- Save responses to `_research/beta-results/{tester_id}.md` (gitignored, local
  only; **never commit real client info or PII**).
- Aggregate into `_research/beta-aggregate.md` for the launch page; redact
  everything except quotes the tester explicitly cleared in Q9.
- This aggregate file is the proof artifact for **claim c3** in the truth
  layer. Update `~/.claude/state/product_truth/bookkeeping-mcp.json` claim c3
  evidence ref to point to it once you have 3 responses.

## Cadence (suggested)

- **Day 0:** post in 1 subreddit + DM 3 warm contacts. Total ~30 min.
- **Day 0–7:** field replies, screen for "actually a bookkeeper, not a
  bot/competitor/AI-evangelist tourist." Target 5–8 yeses to get 3 finishers.
- **Day 1 after each yes:** send install link + the one-pager + intake form.
- **Day 7:** Slack/DM check-in: "How's it going? Anything broken?"
- **Day 14:** send the feedback form. Don't be afraid to send a polite ping at
  day 16 if they ghost — bookkeepers are busy at month-end.
- **Day 21:** publish the aggregate, update truth-layer c3 evidence, do the
  launch.

## What "done" looks like for c3

3 completed responses to Q1 of the 14-day survey, where the answer is
"Send-ready, sent as-is" OR "Send-ready with minor edits". That's verbatim
the claim wording. If you can't get 3, claim c3 stays unsupported and the
launch page must not use chase_draft as a marketed feature — `txn_classify`
+ `invoice_extract` are still launchable on the eval-harness evidence alone.
