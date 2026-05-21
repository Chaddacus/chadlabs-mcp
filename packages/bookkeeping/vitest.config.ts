import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // In tests, resolve @chadlabs/core to the local shim so tests run
      // without the real core package being built.
      "@chadlabs/core": resolve(__dirname, "src/__core_shim__.ts"),
    },
  },
  test: {
    globals: false,
    environment: "node",
  },
});
