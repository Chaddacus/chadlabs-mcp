#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../src/db/migrations.js";
import { defaultDbPath } from "../src/db/connection.js";

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname ?? __dirname, "..", "package.json"), "utf8")
    );
    return pkg.version;
  } catch {
    return "unknown";
  }
}

function init(): void {
  const path = defaultDbPath();
  mkdirSync(dirname(path), { recursive: true });
  const isNew = !existsSync(path);
  const db = openDb(path);
  const result = migrate(db, migrations);
  db.close();
  console.log(`Database ${isNew ? "initialized" : "re-checked"} at: ${path}`);
  if (result.applied.length === 0) {
    console.log("Migrations applied: (already up to date)");
  } else {
    console.log(`Migrations applied: ${result.applied.join(", ")}`);
  }
}

async function serve(): Promise<void> {
  const { serve: runServer } = await import("../src/server.js");
  await runServer();
}

function doctor(): void {
  const path = defaultDbPath();
  const exists = existsSync(path);
  console.log("=== prior-auth-mcp doctor ===");
  console.log(`Package version : ${readPackageVersion()}`);
  console.log(`DB path         : ${path}`);
  console.log(`DB exists       : ${exists}`);
  if (exists) {
    const db = openDb(path);
    const row = db
      .prepare("SELECT MAX(version) as v FROM _migrations")
      .get() as { v: number | null };
    console.log(`Schema version  : ${row.v ?? "n/a"}`);
    db.close();
  }
  console.log();
  console.log("Claude Desktop snippet (add to ~/Library/Application Support/Claude/claude_desktop_config.json):");
  console.log(JSON.stringify(
    { mcpServers: { "prior-auth": { command: "npx", args: ["-y", "@chadlabs/prior-auth", "serve"] } } },
    null,
    2
  ));
  console.log();
  console.log("Goose snippet (add to ~/.config/goose/config.yaml under extensions:):");
  console.log("  prior-auth:\n    type: stdio\n    command: npx\n    args: [\"-y\", \"@chadlabs/prior-auth\", \"serve\"]");
}

const cmd = process.argv[2] ?? "help";
switch (cmd) {
  case "init":
    init();
    break;
  case "serve":
    serve().catch((e) => {
      console.error(e);
      process.exit(1);
    });
    break;
  case "doctor":
    doctor();
    break;
  case "version":
    console.log(readPackageVersion());
    break;
  case "help":
  default:
    console.log(`prior-auth-mcp ${readPackageVersion()}

Usage:
  prior-auth-mcp init       Initialize the local SQLite database
  prior-auth-mcp serve      Run the MCP server over stdio (host invokes this)
  prior-auth-mcp doctor     Print diagnostic info + host config snippets
  prior-auth-mcp version    Print version
  prior-auth-mcp help       Show this help`);
    break;
}
