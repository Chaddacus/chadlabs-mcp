#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { openDb, migrate, checkLicense } from "@chadlabs/core";
import { migrations } from "../src/db/migrations.js";

function defaultDbPath(): string {
  return (
    process.env["CHADLABS_BOOKKEEPING_DB"] ??
    join(homedir(), ".chadlabs", "bookkeeping", "db.sqlite")
  );
}

function ensureDir(p: string): void {
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function hostSnippets(): string {
  const claude = JSON.stringify(
    {
      mcpServers: {
        bookkeeping: {
          command: "npx",
          args: ["@chadlabs/bookkeeping", "serve"],
          env: { CHADLABS_DEV_MODE: "1" },
        },
      },
    },
    null,
    2
  );
  const goose = `extensions:
  bookkeeping:
    type: stdio
    cmd: npx
    args: ["@chadlabs/bookkeeping", "serve"]
    env:
      CHADLABS_DEV_MODE: "1"`;

  return `# Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):
${claude}

# Goose (~/.config/goose/config.yaml):
${goose}

# Cursor / Continue / Codex / any MCP host: run \`npx @chadlabs/bookkeeping serve\`.
`;
}

async function main(): Promise<void> {
  const [, , subcommand, ...rest] = process.argv;
  const dbPath = defaultDbPath();

  switch (subcommand) {
    case "init": {
      ensureDir(dbPath);
      const db = openDb(dbPath);
      const result = migrate(db, migrations);
      db.close();

      console.log(`Database initialized at: ${dbPath}`);
      console.log(
        `Migrations applied: ${result.applied.length === 0 ? "(already up to date)" : result.applied.join(", ")}`
      );
      console.log("");
      console.log("Add bookkeeping-mcp to your host's MCP config:");
      console.log("");
      console.log(hostSnippets());
      break;
    }

    case "serve": {
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

      const licenseKey = process.env["CHADLABS_LICENSE_KEY"];
      const license = await checkLicense({
        licenseKey,
        productSlug: "bookkeeping-mcp",
      });

      console.log("=== bookkeeping-mcp doctor ===");
      console.log(`Package version : ${version}`);
      console.log(`DB path         : ${dbPath}`);
      console.log(`DB exists       : ${existsSync(dbPath)}`);

      if (existsSync(dbPath)) {
        const db = openDb(dbPath);
        const row = db
          .prepare("SELECT MAX(version) as v FROM _migrations")
          .get() as { v: number | null } | undefined;
        console.log(`Schema version  : ${row?.v ?? "none"}`);
        db.close();
      } else {
        console.log("Schema version  : (run \`bookkeeping-mcp init\` first)");
      }

      if (license.valid) {
        console.log(
          `License status  : ✓ valid (tier=${license.tier}${
            license.tier === "paid" ? `, customer=${license.customerId}` : ""
          })`
        );
      } else {
        console.log(`License status  : ✗ invalid (reason=${license.reason})`);
        console.log(
          "                  Set CHADLABS_LICENSE_KEY=CL-XXXX-XXXX or CHADLABS_DEV_MODE=1"
        );
      }

      if (rest.length > 0) {
        console.log(`Unknown args    : ${rest.join(" ")}`);
      }
      break;
    }

    case "version":
    case "--version":
    case "-v": {
      const pkgPath = new URL("../package.json", import.meta.url).pathname;
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
      console.log(pkg.version);
      break;
    }

    case "help":
    case "--help":
    case "-h":
    case undefined: {
      console.log("Usage: bookkeeping-mcp <subcommand>");
      console.log("");
      console.log("Subcommands:");
      console.log("  init     Create the local SQLite DB and print host config snippets");
      console.log("  serve    Start the MCP server over stdio");
      console.log("  doctor   Print versions, DB path, schema version, license status");
      console.log("  version  Print package version");
      console.log("  help     This message");
      console.log("");
      console.log("Environment:");
      console.log("  CHADLABS_BOOKKEEPING_DB    Override DB path (default ~/.chadlabs/bookkeeping/db.sqlite)");
      console.log("  CHADLABS_LICENSE_KEY       Paid license key (matches /^CL-[A-Z0-9]+-[A-Z0-9]+$/)");
      console.log("  CHADLABS_DEV_MODE          Set to 1 to bypass license check");
      break;
    }

    default: {
      console.error(`bookkeeping-mcp: unknown subcommand "${subcommand}"`);
      console.error("Run `bookkeeping-mcp help` for usage.");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
