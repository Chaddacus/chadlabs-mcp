#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { openDb, migrate } from "@chadlabs/core";
import { migrations } from "../src/db/migrations.js";

const DB_DIR = join(homedir(), ".chadlabs", "bookkeeping");
const DB_PATH = join(DB_DIR, "db.sqlite");

function ensureDbDir(): void {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
}

function claudeDesktopSnippet(): string {
  return JSON.stringify(
    {
      mcpServers: {
        "bookkeeping-mcp": {
          command: "bookkeeping-mcp",
          args: ["serve"],
        },
      },
    },
    null,
    2
  );
}

const [, , subcommand, ...rest] = process.argv;

switch (subcommand) {
  case "init": {
    ensureDbDir();
    const db = openDb(DB_PATH);
    migrate(db, migrations);
    db.close();

    console.log(`Database initialized at: ${DB_PATH}`);
    console.log("\nAdd this to your Claude Desktop config (claude_desktop_config.json):");
    console.log(claudeDesktopSnippet());
    break;
  }

  case "serve": {
    // Dynamic import so the MCP server only boots in serve mode
    const { serve } = await import("../src/server.js");
    await serve();
    break;
  }

  case "doctor": {
    const pkgPath = new URL("../package.json", import.meta.url).pathname;
    let version = "unknown";
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
      version = pkg.version;
    } catch {
      // ignore
    }

    console.log("=== bookkeeping-mcp doctor ===");
    console.log(`Package version : ${version}`);
    console.log(`DB path         : ${DB_PATH}`);
    console.log(`DB exists       : ${existsSync(DB_PATH)}`);

    if (existsSync(DB_PATH)) {
      const db = openDb(DB_PATH);
      const row = db
        .prepare(
          "SELECT MAX(version) as v FROM _migrations"
        )
        .get() as { v: number | null } | undefined;
      console.log(`Schema version  : ${row?.v ?? "none"}`);
      db.close();
    } else {
      console.log("Schema version  : (run init first)");
    }

    console.log(`License status  : (not checked in shim — real check in @chadlabs/core)`);

    if (rest.length > 0) {
      console.log(`Unknown args    : ${rest.join(" ")}`);
    }
    break;
  }

  default: {
    console.error(`bookkeeping-mcp: unknown subcommand "${subcommand ?? ""}"`);
    console.error("Usage: bookkeeping-mcp <init|serve|doctor>");
    process.exit(1);
  }
}
