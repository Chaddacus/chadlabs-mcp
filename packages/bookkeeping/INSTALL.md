# Install — @chadlabs/bookkeeping

5-minute setup. Works with any MCP host (Claude Desktop, Goose, Cursor, Codex, Continue, custom clients).

## Prerequisites

- An MCP host already configured with an LLM (your existing setup — Claude Desktop with Claude, Goose with whatever model, Cursor, Continue with Ollama, etc.)
- Node.js 20 or later (`node --version`)
- A license key (or dev mode for testing)

**You do NOT need an Anthropic API key.** This MCP makes zero outbound LLM calls. The host you already use does inference.

## Step 1 — Initialize

```bash
npx @chadlabs/bookkeeping init
```

This creates `~/.chadlabs/bookkeeping/db.sqlite`, runs migrations, and prints the host config snippet for the next step.

## Step 2 — Add to your host's MCP config

### Claude Desktop

Config file location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add to `mcpServers`:

```json
{
  "mcpServers": {
    "bookkeeping": {
      "command": "npx",
      "args": ["@chadlabs/bookkeeping", "serve"],
      "env": {
        "CHADLABS_LICENSE_KEY": "CL-XXXX-XXXX"
      }
    }
  }
}
```

Dev mode (free, no license check):

```json
"env": { "CHADLABS_DEV_MODE": "1" }
```

### Goose

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  bookkeeping:
    type: stdio
    cmd: npx
    args: ["@chadlabs/bookkeeping", "serve"]
    env:
      CHADLABS_LICENSE_KEY: "CL-XXXX-XXXX"
```

### Cursor / Continue / Codex

Use your host's standard MCP server registration. The command is always:

```
npx @chadlabs/bookkeeping serve
```

## Step 3 — Restart your host

Quit and relaunch (Claude Desktop, Goose, Cursor, whatever).

## Step 4 — Verify

In a conversation with your host, ask it to use the `invoice_extract` prompt on a pasted invoice email:

> Load the `invoice_extract` prompt and the `bookkeeping://categories` resource, then run it against this email: [paste an invoice]

The host should:
1. Load the prompt (system + JSON schema).
2. Load the categories resource (chart of accounts).
3. Call its own LLM with your email body.
4. Return 12-field structured invoice JSON.

If the host doesn't natively load prompts/resources, you can also call them inline:
> Show me the `invoice_extract` prompt from bookkeeping, then apply it to this email: [...]

## Troubleshooting

| Symptom | Fix |
|---|---|
| "License check failed: missing" | Set `CHADLABS_LICENSE_KEY` or `CHADLABS_DEV_MODE=1` in the env block |
| "Cannot find module @chadlabs/bookkeeping" | Run `npx -y @chadlabs/bookkeeping init` first |
| Tool/prompt list doesn't show bookkeeping entries | Confirm the host is fully restarted (not just window-closed) |
| Database errors | `rm -rf ~/.chadlabs/bookkeeping && npx @chadlabs/bookkeeping init` |
| Custom DB path | `CHADLABS_BOOKKEEPING_DB=/path/to/file.sqlite` in the env block |

## Update

```bash
npx @chadlabs/bookkeeping@latest init
```

Migrations are idempotent. Existing data is preserved.

## What if my host doesn't support MCP prompts/resources?

Some MCP hosts only support tools (not prompts/resources). In that case, you can:

- Read the prompt source directly from `packages/bookkeeping/src/prompts/{invoice_extract,txn_classify,chase_draft}.ts` and paste the system text manually into the host.
- Or use a host that supports the full MCP spec (Claude Desktop, Goose, Cursor recent builds).

Tools (`vendor_lookup`, `vendor_remember`, `chase_log_record`) work in any MCP host.
