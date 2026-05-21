export interface MarketplaceAdapter {
  name: string;
  priceDisplay: string;
  purchaseUrl(productSlug: string): string;
  licenseValidationHint(): string;
}

const apify: MarketplaceAdapter = {
  name: "apify",
  priceDisplay: "Pay-per-use",
  purchaseUrl: (productSlug) => `https://apify.com/chadlabs/${productSlug}`,
  licenseValidationHint: () => "Set CHADLABS_LICENSE_KEY to your Apify actor token.",
};

const mcpize: MarketplaceAdapter = {
  name: "mcpize",
  priceDisplay: "Monthly subscription",
  purchaseUrl: (productSlug) => `https://mcpize.com/servers/chadlabs-${productSlug}`,
  licenseValidationHint: () => "Set CHADLABS_LICENSE_KEY to your MCPize license key.",
};

const agensi: MarketplaceAdapter = {
  name: "agensi",
  priceDisplay: "Per-seat license",
  purchaseUrl: (productSlug) => `https://agensi.ai/tools/chadlabs/${productSlug}`,
  licenseValidationHint: () => "Set CHADLABS_LICENSE_KEY to your Agensi license key.",
};

const xpay: MarketplaceAdapter = {
  name: "xpay",
  priceDisplay: "One-time purchase",
  purchaseUrl: (productSlug) => `https://xpay.app/chadlabs/${productSlug}`,
  licenseValidationHint: () => "Set CHADLABS_LICENSE_KEY to your xpay order key.",
};

export const adapters: Record<string, MarketplaceAdapter> = {
  apify,
  mcpize,
  agensi,
  xpay,
};
