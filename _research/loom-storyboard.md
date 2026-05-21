# Loom storyboard — BookkeepingMCP demo

Two recordings. Each ~3–4 minutes. Both follow the same beats but use different
hosts so the "bring your own model" claim is visible, not just stated.

## Pre-flight (do this once, before recording)

1. Clean macOS profile — close every app that might notify on-screen (Slack, Mail, iMessage, calendar). Turn on **Do Not Disturb**.
2. Empty terminal window, large font (~14pt), dark theme. Window at 1440×900.
3. The MCP package needs to be installable. Until npm-published:
   - `cd ~/personal-ventures/chadlabs-mcp && pnpm install && pnpm -r build`
   - `pnpm --filter @chadlabs/bookkeeping link --global` (or use the absolute path to the built `dist/bin/cli.js` in the host config)
4. Have a real-looking invoice email in your clipboard or open in a TextEdit window. The Notion sample from `eval/fixtures.ts` works.
5. Test-run the entire script once without recording to catch tripwires.

## Recording 1 — Claude Desktop demo

**Target length: 3:30. Hard ceiling: 5:00.**

| Beat | Time | What's on screen | What you say (read approximately) |
|---|---|---|---|
| 0 | 0:00–0:15 | Browser at https://bookkeeping.chadacus.dev | "BookkeepingMCP. The bit of the bookkeeping job you don't actually like — chasing receipts, decoding old transactions, writing the same chase email every week. Three-tool MCP server, runs inside whichever AI host you already use. Quick demo." |
| 1 | 0:15–0:45 | Terminal: `npx -y @chadlabs/bookkeeping init`, then `npx -y @chadlabs/bookkeeping doctor` | "One-line install. `init` creates the local SQLite DB. `doctor` prints the exact config snippet I'm about to paste into Claude Desktop." |
| 2 | 0:45–1:00 | macOS Finder showing `~/Library/Application Support/Claude/claude_desktop_config.json` in a text editor. Paste the snippet. | "Paste, save, restart Claude Desktop." |
| 3 | 1:00–1:30 | Claude Desktop opens. Show the MCP icon in the input bar — `bookkeeping` is listed as connected. | "Bookkeeping is connected. Three Prompts and one Resource — the chart of accounts — and three Tools the model can call." |
| 4 | 1:30–2:15 | Type into Claude: "Use the bookkeeping invoice_extract prompt on this email" + paste the Notion invoice. Wait for Claude to run the prompt + return JSON. | "Invoice in. Vendor normalized to `notion`, amount $16, currency USD, category `Software & SaaS` from my chart of accounts. Confidence 0.95. No human re-keying." |
| 5 | 2:15–2:45 | Same Claude session, ask: "Now categorize these 5 transactions: [paste 5 from `eval/fixtures.ts` TXN list]" | "Five transactions, five classifications, one-sentence reason per row. Cloud Hosting / Travel / Software & SaaS / Meals / Salaries. All from the chart of accounts — no random made-up categories." |
| 6 | 2:45–3:15 | Ask Claude: "Draft a friendly chase email to Sarah for the missing $50 receipt from 2026-05-01." Show subject, markdown body, plain body. | "And the chase email I'd otherwise spend 8 minutes writing. Friendly tone. Send-ready or one quick edit." |
| 7 | 3:15–3:30 | Cut back to browser at bookkeeping.chadacus.dev with the "Join the early-access list" CTA highlighted. | "$29/mo at launch. Free for beta testers. Email on the landing page. Local SQLite, your own model, no token markup." |

## Recording 2 — Goose + Ollama (local-model demo)

**Same beats, different host.** The point: prove the bring-your-own-model claim by showing it working with a fully-local Llama instead of Claude.

**Target length: 3:00.**

Differences from Recording 1:

- Step 2 pastes Goose's config (`~/.config/goose/config.yaml` on macOS or whatever your machine uses) — `doctor` prints both Claude Desktop and Goose snippets.
- Step 3 shows Goose CLI session instead of Claude Desktop.
- During Step 4, say out loud: "Notice my Wi-Fi is off." Toggle Wi-Fi off in the menu bar before invoking. The invoice extract still works because Llama is running locally via Ollama.
- Step 7: emphasize "if you don't trust any AI vendor with client data, run the whole thing local. Llama 3.3 70B handled this in 4 seconds on an M3 Max."

## Adversarial pre-record checklist

Run this before hitting record. If any line is "no", stop and fix.

- [ ] Did `pnpm --filter @chadlabs/bookkeeping smoke:network` pass on this checkout?
- [ ] Did the actual install command (`npx -y @chadlabs/bookkeeping init` OR the local-link equivalent) succeed on a fresh terminal?
- [ ] Does `doctor` print a real path for `DB exists: true`?
- [ ] Have you stripped any real client info from the test fixtures?
- [ ] Is your terminal scrollback empty? (Cmd+K)
- [ ] Is Loom recording the right window only — not your whole desktop?
- [ ] Mic level checked? (Run a 10-second test, listen back.)
- [ ] Is your name + chad@chadacus.dev visible in the doctor output? If so, fine. If something private leaks, redact in post-prod.

## Post-record

- Trim dead air at start/end.
- Loom auto-transcribes — read the transcript and fix any place where you said "uh" or trailed off.
- Title: **"BookkeepingMCP — invoice triage, transaction classify, chase emails. In Claude Desktop, in 3 minutes."**
- Description first line: "Solo bookkeeper? This is the noise-reduction layer. $29/mo at launch, free for beta. bookkeeping.chadacus.dev"
- Pin Recording 1 in the Loom workspace. Embed in the landing page (replace the Quickstart code block with the embed once it's recorded).

## What this video does NOT do

- It does **not** show real client data. Use the fixture invoices.
- It does **not** claim integration with QBO, Xero, or any bank feed. We don't have those — the workflow is "you paste an email, you paste a transaction list."
- It does **not** show the cross-host eval numbers on-screen. The numbers belong in the landing page or a separate "How accurate?" video, not in a 3-minute demo.

## Asciinema fallback (for users who hate video)

If you don't get to record Loom in the first launch window, ship an asciinema
recording of just the terminal flow:

```bash
brew install asciinema
asciinema rec _research/demo.cast
# run init / doctor / serve / a fake stdio invocation
exit
# upload to asciinema.org and embed
```

That gets the install + doctor flow on the page in under 30 minutes of work
without a face/voice on camera.
