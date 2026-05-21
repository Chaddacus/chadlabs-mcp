export { serve, tools, prompts, resources } from "./server.js";

export {
  invoiceExtractPrompt,
  INVOICE_EXTRACT_SYSTEM,
} from "./prompts/invoice_extract.js";
export {
  txnClassifyPrompt,
  TXN_CLASSIFY_SYSTEM,
} from "./prompts/txn_classify.js";
export {
  chaseDraftPrompt,
  CHASE_DRAFT_SYSTEM,
} from "./prompts/chase_draft.js";

export { categoriesResource, CATEGORIES } from "./resources/categories.js";

export {
  vendorLookupTool,
  VendorLookupInputSchema,
  lookupVendors,
  type VendorLookupInput,
  type VendorMatch,
} from "./tools/vendor_lookup.js";

export {
  vendorRememberTool,
  VendorRememberInputSchema,
  type VendorRememberInput,
} from "./tools/vendor_remember.js";

export {
  chaseLogRecordTool,
  ChaseLogRecordInputSchema,
  type ChaseLogRecordInput,
} from "./tools/chase_log_record.js";

export { migrations } from "./db/migrations.js";
export { defaultDbPath, getDb, _setDbForTesting, _resetDb } from "./db/connection.js";
