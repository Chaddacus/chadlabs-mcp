import { describe, it, expect } from "vitest";
import { adapters } from "../marketplace.js";

const EXPECTED = ["apify", "mcpize", "agensi", "xpay"];

describe("adapters", () => {
  it("all 4 adapters are present", () => {
    for (const name of EXPECTED) {
      expect(adapters[name]).toBeDefined();
    }
  });

  it("each adapter has a name property matching its key", () => {
    for (const key of EXPECTED) {
      expect(adapters[key]?.name).toBe(key);
    }
  });

  it("each adapter's purchaseUrl contains the productSlug", () => {
    const slug = "my-tool";
    for (const key of EXPECTED) {
      const url = adapters[key]?.purchaseUrl(slug);
      expect(url).toContain(slug);
    }
  });

  it("each adapter returns a non-empty licenseValidationHint", () => {
    for (const key of EXPECTED) {
      const hint = adapters[key]?.licenseValidationHint();
      expect(hint).toBeTruthy();
    }
  });
});
