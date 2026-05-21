#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../src/db/migrations.js";
import { defaultDbPath } from "../src/db/connection.js";

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname ?? __dirname, "..", "package.json"), "utf8"));
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
  console.log(result.applied.length === 0 ? "Migrations applied: (already up to date)" : `Migrations applied: ${result.applied.join(", ")}`);
}

async function serve(): Promise<void> {
  const { serve: runServer } = await import("../src/server.js");
  await runServer();
}

function doctor(): void {
  const path = defaultDbPath();
  const exists = existsSync(path);
  console.log("=== commission-recon-mcp doctor ===");
  console.log(`Package version : ${readPackageVersion()}`);
  console.log(`DB path         : ${path}`);
  console.log(`DB exists       : ${exists}`);
  if (exists) {
    const db = openDb(path);
    const row = db.prepare("SELECT MAX(version) as v FROM _migrations").get() as { v: number | null };
    console.log(`Schema version  : ${row.v ?? "n/a"}`);
    db.close();
  }
  console.log();
  console.log("Claude Desktop snippet (add to claude_desktop_config.json):");
  console.log(JSON.stringify({ mcpServers: { "commission-recon": { command: "npx", args: ["-y", "@chadlabs/commission-recon", "serve"] } } }, null, 2));
  console.log();
  console.log("Goose snippet (~/.config/goose/config.yaml under extensions:):");
  console.log("  commission-recon:\n    type: stdio\n    command: npx\n    args: [\"-y\", \"@chadlabs/commission-recon\", \"serve\"]");
}

const cmd = process.argv[2] ?? "help";
switch (cmd) {
  case "init": init(); break;
  case "serve": serve().catch((e) => { console.error(e); process.exit(1); }); break;
  case "doctor": doctor(); break;
  case "version": console.log(readPackageVersion()); break;
  case "help":
  default:
    console.log(`commission-recon-mcp ${readPackageVersion()}

Usage:
  commission-recon-mcp init       Initialize the local SQLite database
  commission-recon-mcp serve      Run the MCP server over stdio
  commission-recon-mcp doctor     Print diagnostic info + host config snippets
  commission-recon-mcp version    Print version
  commission-recon-mcp help       Show this help`);
}
