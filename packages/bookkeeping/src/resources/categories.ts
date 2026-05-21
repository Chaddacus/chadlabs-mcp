import type { Resource } from "../__core_shim__.js";

/**
 * Standard small-business chart of accounts.
 *
 * Loaded by the host LLM as MCP resource `bookkeeping://categories` so the
 * extract / classify prompts can produce consistent category names across
 * sessions.
 */
export const CATEGORIES: ReadonlyArray<{
  name: string;
  parent: string | null;
  description: string;
}> = [
  // Revenue
  { name: "Revenue", parent: null, description: "Top-level revenue (use a subcategory when possible)" },
  { name: "Services Revenue", parent: "Revenue", description: "Income from services rendered, consulting, software subscriptions you sell" },
  { name: "Product Revenue", parent: "Revenue", description: "Income from physical or digital goods sold" },
  { name: "Other Revenue", parent: "Revenue", description: "Refunds received, royalties, miscellaneous income" },

  // COGS
  { name: "COGS", parent: null, description: "Cost of goods/services sold (top level)" },
  { name: "Direct Labor", parent: "COGS", description: "Wages directly tied to producing a billable deliverable" },
  { name: "Subcontractors", parent: "COGS", description: "Contractor and freelance payments tied to client work" },
  { name: "Direct Materials", parent: "COGS", description: "Inventory, manufacturing inputs, fulfillment via Printful/Shopify orders" },

  // Operating expenses
  { name: "Operating Expenses", parent: null, description: "Catch-all operating cost (use a subcategory when possible)" },
  { name: "Office & Admin", parent: "Operating Expenses", description: "Coworking, office furniture, general admin" },
  { name: "Office Supplies", parent: "Operating Expenses", description: "Pens, paper, printer toner, small office goods" },
  { name: "Postage & Shipping", parent: "Operating Expenses", description: "USPS, FedEx, stamps, PO boxes" },
  { name: "Printing", parent: "Operating Expenses", description: "Business cards, brochures, print fulfillment" },

  // Technology
  { name: "Technology", parent: null, description: "Tools and infrastructure (use a subcategory when possible)" },
  { name: "Software & SaaS", parent: "Technology", description: "SaaS subscriptions, software licenses, dev tools (Notion, Figma, GitHub, Slack)" },
  { name: "Hardware", parent: "Technology", description: "Computers, peripherals, devices" },
  { name: "Cloud Hosting", parent: "Technology", description: "AWS, GCP, Cloudflare, Vercel, DigitalOcean, hosting infrastructure" },
  { name: "Domain & Website", parent: "Technology", description: "Domain registration, DNS, SSL, web hosting" },

  // Travel & meals
  { name: "Travel & Meals", parent: null, description: "Top-level travel + meals (prefer a subcategory)" },
  { name: "Travel", parent: "Travel & Meals", description: "Flights, hotels, rideshare, transit, rental cars" },
  { name: "Meals & Entertainment", parent: "Travel & Meals", description: "Meals during travel or with clients, coffee, restaurant" },

  // Marketing
  { name: "Marketing", parent: null, description: "Marketing/advertising spend (top level — prefer subcategory)" },
  { name: "Advertising", parent: "Marketing", description: "Paid ads (Google, Meta, Reddit, X, newsletter sponsorships)" },

  // Professional / payroll
  { name: "Professional Fees", parent: null, description: "Lawyers, accountants, CPAs, professional advisors" },
  { name: "Payroll & Benefits", parent: null, description: "Top-level payroll (prefer subcategory)" },
  { name: "Salaries & Wages", parent: "Payroll & Benefits", description: "Employee wages and contractor payroll (Gusto, JustWorks)" },
  { name: "Payroll Taxes", parent: "Payroll & Benefits", description: "Employer payroll tax remittance" },
  { name: "Benefits", parent: "Payroll & Benefits", description: "Health insurance, FSA, retirement, employee benefits" },

  // Fallbacks
  { name: "Other Expenses", parent: null, description: "Expenses that don't fit anywhere else but are clearly business" },
  { name: "Uncategorized", parent: null, description: "Use only when category truly cannot be determined from available info" },
];

function renderCategoriesMarkdown(): string {
  const lines: string[] = ["# Chart of Accounts", "", "Use the exact `name` field when classifying. Prefer subcategories over parents.", ""];
  const parents = CATEGORIES.filter((c) => c.parent === null);
  for (const p of parents) {
    lines.push(`## ${p.name}`);
    lines.push(`${p.description}`);
    lines.push("");
    const children = CATEGORIES.filter((c) => c.parent === p.name);
    if (children.length === 0) {
      lines.push("_No subcategories._");
    } else {
      for (const c of children) {
        lines.push(`- **${c.name}** — ${c.description}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const CATEGORIES_MARKDOWN = renderCategoriesMarkdown();

/**
 * Flat list of valid category `name` values. The host can inject this into
 * extract/classify prompts so the model is constrained to the exact taxonomy.
 */
export const CATEGORY_NAMES: ReadonlyArray<string> = CATEGORIES.map((c) => c.name);

export const categoriesResource: Resource = {
  uri: "bookkeeping://categories",
  name: "Chart of accounts",
  description:
    "Standard small-business chart of accounts. Load this so extract/classify prompts produce consistent category names.",
  mimeType: "text/markdown",
  async read() {
    return renderCategoriesMarkdown();
  },
};
