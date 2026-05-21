import { describe, it, expect } from "vitest";
import { recordNetworkActivity, assertOnlyAnthropicAPI } from "../privacy.js";

describe("recordNetworkActivity", () => {
  it("returns result from callback and an activity record", async () => {
    const { result, activity } = await recordNetworkActivity(async () => 42);
    expect(result).toBe(42);
    expect(activity).toHaveProperty("destinations");
    expect(activity).toHaveProperty("suspicious");
  });

  it("activity record is empty (v1 stub)", async () => {
    const { activity } = await recordNetworkActivity(async () => "x");
    expect(activity.destinations).toEqual([]);
    expect(activity.suspicious).toEqual([]);
  });
});

describe("assertOnlyAnthropicAPI", () => {
  it("returns ok=true for empty destinations", () => {
    const result = assertOnlyAnthropicAPI({ destinations: [], suspicious: [] });
    expect(result).toEqual({ ok: true, violations: [] });
  });

  it("returns ok=true for destinations on the allowlist", () => {
    const result = assertOnlyAnthropicAPI({
      destinations: ["api.anthropic.com"],
      suspicious: [],
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("returns ok=false when a non-allowlisted destination is present", () => {
    const result = assertOnlyAnthropicAPI({
      destinations: ["api.anthropic.com", "evil.example.com"],
      suspicious: [],
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toContain("evil.example.com");
  });
});
