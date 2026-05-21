import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkLicense } from "../license.js";

describe("checkLicense", () => {
  let originalDevMode: string | undefined;
  let originalLicenseKey: string | undefined;

  beforeEach(() => {
    originalDevMode = process.env.CHADLABS_DEV_MODE;
    originalLicenseKey = process.env.CHADLABS_LICENSE_KEY;
    delete process.env.CHADLABS_DEV_MODE;
    delete process.env.CHADLABS_LICENSE_KEY;
  });

  afterEach(() => {
    if (originalDevMode !== undefined) {
      process.env.CHADLABS_DEV_MODE = originalDevMode;
    } else {
      delete process.env.CHADLABS_DEV_MODE;
    }
    if (originalLicenseKey !== undefined) {
      process.env.CHADLABS_LICENSE_KEY = originalLicenseKey;
    } else {
      delete process.env.CHADLABS_LICENSE_KEY;
    }
  });

  it("dev mode via CHADLABS_DEV_MODE=1", async () => {
    process.env.CHADLABS_DEV_MODE = "1";
    const result = await checkLicense({ productSlug: "test" });
    expect(result).toEqual({ valid: true, tier: "dev" });
  });

  it("dev mode via DEV-LOCAL key", async () => {
    const result = await checkLicense({ licenseKey: "DEV-LOCAL", productSlug: "test" });
    expect(result).toEqual({ valid: true, tier: "dev" });
  });

  it("valid paid key format returns tier paid with customerId", async () => {
    const result = await checkLicense({ licenseKey: "CL-ABCD-1234", productSlug: "test" });
    expect(result).toEqual({ valid: true, tier: "paid", customerId: "ABCD" });
  });

  it("invalid format returns invalid reason", async () => {
    const result = await checkLicense({ licenseKey: "BAD-KEY", productSlug: "test" });
    expect(result).toEqual({ valid: false, reason: "invalid" });
  });

  it("missing key returns missing reason", async () => {
    const result = await checkLicense({ productSlug: "test" });
    expect(result).toEqual({ valid: false, reason: "missing" });
  });
});
