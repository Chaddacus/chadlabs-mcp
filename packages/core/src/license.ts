export type LicenseResult =
  | { valid: true; tier: "dev" }
  | { valid: true; tier: "paid"; customerId: string }
  | { valid: false; reason: "missing" | "invalid" };

const PAID_KEY_RE = /^CL-[A-Z0-9]{4,}-[A-Z0-9]{4,}$/;

export async function checkLicense(opts: {
  licenseKey?: string;
  productSlug: string;
}): Promise<LicenseResult> {
  if (process.env.CHADLABS_DEV_MODE === "1" || opts.licenseKey === "DEV-LOCAL") {
    return { valid: true, tier: "dev" };
  }
  if (!opts.licenseKey) {
    return { valid: false, reason: "missing" };
  }
  if (PAID_KEY_RE.test(opts.licenseKey)) {
    // customerId derived from the segment after "CL-"
    const customerId = opts.licenseKey.split("-")[1] ?? opts.licenseKey;
    return { valid: true, tier: "paid", customerId };
  }
  return { valid: false, reason: "invalid" };
}

export function withLicenseGate<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>,
  productSlug: string
): (args: TArgs) => Promise<TResult | { content: Array<{ type: "text"; text: string }> }> {
  return async (args: TArgs) => {
    const key = process.env.CHADLABS_LICENSE_KEY;
    const result = await checkLicense({ licenseKey: key, productSlug });
    if (!result.valid) {
      return {
        content: [
          {
            type: "text" as const,
            text: `License check failed: ${result.reason}. Set CHADLABS_LICENSE_KEY or CHADLABS_DEV_MODE=1.`,
          },
        ],
      };
    }
    return handler(args);
  };
}
