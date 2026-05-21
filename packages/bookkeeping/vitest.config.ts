import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Resolve @chadlabs/core to its source so tests don't need a separate
      // build step. The workspace symlink points at packages/core/package.json
      // whose `main` is dist/, so without this alias every test run would
      // require `pnpm --filter @chadlabs/core build` first.
      "@chadlabs/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  test: {
    globals: false,
    environment: "node",
  },
});
