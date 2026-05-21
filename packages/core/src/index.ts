export { defineMCPServer } from "./server.js";
export type {
  Tool,
  ToolHandler,
  Prompt,
  PromptArgument,
  Resource,
  MCPServerOptions,
  MCPServerInstance,
} from "./server.js";

export { checkLicense, withLicenseGate } from "./license.js";
export type { LicenseResult } from "./license.js";

export { openDb, migrate } from "./db.js";
export type { Migration } from "./db.js";

export { adapters } from "./marketplace.js";
export type { MarketplaceAdapter } from "./marketplace.js";

export { recordNetworkActivity, assertOnlyAnthropicAPI } from "./privacy.js";
export type { NetworkActivityRecord } from "./privacy.js";
