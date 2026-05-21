# Install — @chadlabs/bookkeeping

5-minute setup for Claude Desktop on macOS / Linux / Windows.

## Prerequisites

- Claude Desktop installed and signed in (https://claude.ai/download)
- Node.js 20 or later (`node --version`)
- A license key (or dev mode for testing)

## Step 1 — Initialize

```bash
npx @chadlabs/bookkeeping init
```

This creates `~/.chadlabs/bookkeeping/db.sqlite` and prints the Claude Desktop config snippet for the next step.

## Step 2 — Add to Claude Desktop config

Open Claude Desktop's config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the `bookkeeping` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "bookkeeping": {
      "command": "npx",
      "args": ["@chadlabs/bookkeeping", "serve"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "CHADLABS_LICENSE_KEY": "CL-XXXX-XXXX"
      }
    }
  }
}
```

Dev mode (free, full features, no license check):

```json
"env": {
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "CHADLABS_DEV_MODE": "1"
}
```

## Step 3 — Restart Claude Desktop

Quit and relaunch. Claude will pick up the new MCP server on startup.

## Step 4 — Verify

In a Claude conversation, type:

> Use the `invoice_extract` tool to pull invoice details from this email: [paste an invoice email body here]

Claude should call the tool and return a 12-field structured JSON.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "License check failed: missing" | Set `CHADLABS_LICENSE_KEY` or `CHADLABS_DEV_MODE=1` in the env block |
| "Cannot find module @chadlabs/bookkeeping" | Run `npx -y @chadlabs/bookkeeping init` first to install |
| Tool list doesn't show bookkeeping tools | Confirm Claude Desktop is fully quit (not just window-closed) and restarted |
| Anthropic API errors | Verify `ANTHROPIC_API_KEY` is set in the env block, not just your shell |
| Database errors | `rm -rf ~/.chadlabs/bookkeeping && npx @chadlabs/bookkeeping init` |

## Update

```bash
npx @chadlabs/bookkeeping@latest init
```

Re-running `init` against an existing DB is a no-op for the schema (migrations are idempotent).
