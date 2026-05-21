export interface TxnFixture {
  id: string;
  date: string;
  amount: number;
  description: string;
  /** Expected category for mock assertions */
  expected_category: string;
}

export const transactionFixtures: TxnFixture[] = [
  // Clearly classifiable — tech/SaaS
  { id: "txn-001", date: "2024-03-01", amount: 20.0, description: "OPENAI API USAGE", expected_category: "Software & SaaS" },
  { id: "txn-002", date: "2024-03-02", amount: 99.0, description: "GITHUB COPILOT MONTHLY", expected_category: "Software & SaaS" },
  { id: "txn-003", date: "2024-03-03", amount: 12.0, description: "NOTION.SO SUBSCRIPTION", expected_category: "Software & SaaS" },
  { id: "txn-004", date: "2024-03-04", amount: 45.0, description: "FIGMA PROFESSIONAL PLAN", expected_category: "Software & SaaS" },
  { id: "txn-005", date: "2024-03-05", amount: 92.89, description: "AWS AMAZON WEB SERVICES", expected_category: "Cloud Hosting" },

  // Travel
  { id: "txn-006", date: "2024-03-06", amount: 34.50, description: "UBER TRIP SFO", expected_category: "Travel" },
  { id: "txn-007", date: "2024-03-07", amount: 280.0, description: "UNITED AIRLINES SFO-JFK", expected_category: "Travel" },
  { id: "txn-008", date: "2024-03-08", amount: 149.0, description: "MARRIOTT HOTEL CHARGE", expected_category: "Travel" },

  // Meals
  { id: "txn-009", date: "2024-03-09", amount: 52.40, description: "CLIENT DINNER - NOBU SF", expected_category: "Meals & Entertainment" },
  { id: "txn-010", date: "2024-03-10", amount: 9.43, description: "COFFEE CORNER CAFE", expected_category: "Meals & Entertainment" },

  // Office & Admin
  { id: "txn-011", date: "2024-03-11", amount: 38.99, description: "AMAZON OFFICE SUPPLIES", expected_category: "Office Supplies" },
  { id: "txn-012", date: "2024-03-12", amount: 14.99, description: "USPS PRIORITY MAIL POSTAGE", expected_category: "Postage & Shipping" },

  // Professional fees
  { id: "txn-013", date: "2024-03-13", amount: 500.0, description: "LAWYER RETAINER - SMITH LAW", expected_category: "Professional Fees" },
  { id: "txn-014", date: "2024-03-14", amount: 350.0, description: "ACCOUNTANT MONTHLY ADVISORY", expected_category: "Professional Fees" },

  // Advertising
  { id: "txn-015", date: "2024-03-15", amount: 120.0, description: "GOOGLE ADS CHARGE", expected_category: "Advertising" },
  { id: "txn-016", date: "2024-03-16", amount: 88.0, description: "META FACEBOOK ADS", expected_category: "Advertising" },

  // Ambiguous / harder cases
  { id: "txn-017", date: "2024-03-17", amount: 25.0, description: "AMZN MKTP US*AB1234", expected_category: "Office Supplies" },
  { id: "txn-018", date: "2024-03-18", amount: 200.0, description: "WIRE TRANSFER REF 4821-B", expected_category: "Uncategorized" },
  { id: "txn-019", date: "2024-03-19", amount: 15.99, description: "NETFLIX MONTHLY", expected_category: "Other Expenses" },
  { id: "txn-020", date: "2024-03-20", amount: 1200.0, description: "SUBCONTRACTOR PMT - JANE DOE", expected_category: "Subcontractors" },

  // --- Extended corpus (txn-021..txn-100) ---

  // More SaaS
  { id: "txn-021", date: "2024-04-01", amount: 30.0, description: "ANTHROPIC API USAGE MAR", expected_category: "Software & SaaS" },
  { id: "txn-022", date: "2024-04-02", amount: 8.0, description: "VERCEL HOBBY PLAN", expected_category: "Cloud Hosting" },
  { id: "txn-023", date: "2024-04-03", amount: 25.0, description: "LINEAR.APP TEAM PLAN", expected_category: "Software & SaaS" },
  { id: "txn-024", date: "2024-04-04", amount: 12.0, description: "1PASSWORD FAMILY", expected_category: "Software & SaaS" },
  { id: "txn-025", date: "2024-04-05", amount: 19.0, description: "CLOUDFLARE PRO", expected_category: "Cloud Hosting" },
  { id: "txn-026", date: "2024-04-06", amount: 15.0, description: "NAMECHEAP DOMAIN RENEWAL", expected_category: "Domain & Website" },
  { id: "txn-027", date: "2024-04-07", amount: 9.0, description: "GOOGLE WORKSPACE STARTER", expected_category: "Software & SaaS" },
  { id: "txn-028", date: "2024-04-08", amount: 70.0, description: "DATADOG MONTHLY", expected_category: "Cloud Hosting" },
  { id: "txn-029", date: "2024-04-09", amount: 14.0, description: "SLACK PRO SEAT", expected_category: "Software & SaaS" },
  { id: "txn-030", date: "2024-04-10", amount: 39.0, description: "ZOOM PRO MONTHLY", expected_category: "Software & SaaS" },

  // More travel
  { id: "txn-031", date: "2024-04-11", amount: 18.4, description: "LYFT RIDE", expected_category: "Travel" },
  { id: "txn-032", date: "2024-04-12", amount: 420.0, description: "DELTA AIRLINES JFK-AUS", expected_category: "Travel" },
  { id: "txn-033", date: "2024-04-13", amount: 89.0, description: "HILTON HONORS STAY", expected_category: "Travel" },
  { id: "txn-034", date: "2024-04-14", amount: 65.0, description: "AVIS RENTAL CAR LAX", expected_category: "Travel" },
  { id: "txn-035", date: "2024-04-15", amount: 24.0, description: "BART TRANSIT REFILL", expected_category: "Travel" },

  // More meals
  { id: "txn-036", date: "2024-04-16", amount: 47.0, description: "BLUE BOTTLE COFFEE", expected_category: "Meals & Entertainment" },
  { id: "txn-037", date: "2024-04-17", amount: 132.0, description: "DOORDASH TEAM DINNER", expected_category: "Meals & Entertainment" },
  { id: "txn-038", date: "2024-04-18", amount: 22.0, description: "CHIPOTLE LUNCH", expected_category: "Meals & Entertainment" },
  { id: "txn-039", date: "2024-04-19", amount: 78.0, description: "STARBUCKS REWARDS CARD", expected_category: "Meals & Entertainment" },

  // Office
  { id: "txn-040", date: "2024-04-20", amount: 220.0, description: "STAPLES BUSINESS DEPOT", expected_category: "Office Supplies" },
  { id: "txn-041", date: "2024-04-21", amount: 18.0, description: "FEDEX OVERNIGHT", expected_category: "Postage & Shipping" },
  { id: "txn-042", date: "2024-04-22", amount: 99.0, description: "OFFICE DEPOT TONER", expected_category: "Office Supplies" },
  { id: "txn-043", date: "2024-04-23", amount: 350.0, description: "WEWORK DAY PASSES", expected_category: "Office & Admin" },

  // Professional fees
  { id: "txn-044", date: "2024-04-24", amount: 2000.0, description: "MORGAN STANLEY CPA Q1", expected_category: "Professional Fees" },
  { id: "txn-045", date: "2024-04-25", amount: 800.0, description: "BIZ ATTY CONSULT - WEST LLP", expected_category: "Professional Fees" },
  { id: "txn-046", date: "2024-04-26", amount: 175.0, description: "STATE CORP RENEWAL FEE", expected_category: "Operating Expenses" },

  // Advertising
  { id: "txn-047", date: "2024-04-27", amount: 240.0, description: "REDDIT ADS WEEKLY", expected_category: "Advertising" },
  { id: "txn-048", date: "2024-04-28", amount: 180.0, description: "X CORP TWITTER ADS", expected_category: "Advertising" },
  { id: "txn-049", date: "2024-04-29", amount: 60.0, description: "BUFFER POSTING SCHEDULE", expected_category: "Software & SaaS" },
  { id: "txn-050", date: "2024-04-30", amount: 95.0, description: "INDIE HACKERS NEWSLETTER SPONSOR", expected_category: "Advertising" },

  // Payroll & benefits
  { id: "txn-051", date: "2024-05-01", amount: 4200.0, description: "GUSTO PAYROLL RUN", expected_category: "Salaries & Wages" },
  { id: "txn-052", date: "2024-05-02", amount: 380.0, description: "GUSTO PAYROLL TAXES", expected_category: "Payroll Taxes" },
  { id: "txn-053", date: "2024-05-03", amount: 220.0, description: "JUSTWORKS HEALTH INS", expected_category: "Benefits" },
  { id: "txn-054", date: "2024-05-04", amount: 50.0, description: "FSA PHARMACY", expected_category: "Benefits" },

  // Revenue
  { id: "txn-055", date: "2024-05-05", amount: -1200.0, description: "STRIPE PAYOUT INV #1041", expected_category: "Services Revenue" },
  { id: "txn-056", date: "2024-05-06", amount: -890.0, description: "STRIPE PAYOUT INV #1042", expected_category: "Services Revenue" },
  { id: "txn-057", date: "2024-05-07", amount: -29.0, description: "STRIPE SUB CHARGE", expected_category: "Services Revenue" },
  { id: "txn-058", date: "2024-05-08", amount: -3500.0, description: "WIRE FROM CLIENT - PROJECT MILESTONE 2", expected_category: "Services Revenue" },

  // Subcontractors
  { id: "txn-059", date: "2024-05-09", amount: 2400.0, description: "ACH TRANSFER - DESIGN CONTRACTOR", expected_category: "Subcontractors" },
  { id: "txn-060", date: "2024-05-10", amount: 800.0, description: "UPWORK MILESTONE", expected_category: "Subcontractors" },

  // Cloud / hosting
  { id: "txn-061", date: "2024-05-11", amount: 245.0, description: "AWS AMAZON WEB SERVICES", expected_category: "Cloud Hosting" },
  { id: "txn-062", date: "2024-05-12", amount: 32.0, description: "GCP GOOGLE CLOUD", expected_category: "Cloud Hosting" },
  { id: "txn-063", date: "2024-05-13", amount: 18.0, description: "DIGITALOCEAN MONTHLY", expected_category: "Cloud Hosting" },
  { id: "txn-064", date: "2024-05-14", amount: 110.0, description: "FLY.IO MONTHLY", expected_category: "Cloud Hosting" },

  // Hardware
  { id: "txn-065", date: "2024-05-15", amount: 1899.0, description: "APPLE M3 MACBOOK PRO", expected_category: "Hardware" },
  { id: "txn-066", date: "2024-05-16", amount: 159.0, description: "LOGITECH KEYBOARD", expected_category: "Hardware" },
  { id: "txn-067", date: "2024-05-17", amount: 79.0, description: "ANKER USB-C HUB", expected_category: "Hardware" },

  // Direct materials / COGS-ish
  { id: "txn-068", date: "2024-05-18", amount: 340.0, description: "PRINTFUL ORDER", expected_category: "Direct Materials" },
  { id: "txn-069", date: "2024-05-19", amount: 1100.0, description: "SHOPIFY INVENTORY ORDER", expected_category: "Direct Materials" },

  // Marketing tools
  { id: "txn-070", date: "2024-05-20", amount: 49.0, description: "AHREFS LITE", expected_category: "Marketing" },
  { id: "txn-071", date: "2024-05-21", amount: 99.0, description: "SEMRUSH PRO", expected_category: "Marketing" },
  { id: "txn-072", date: "2024-05-22", amount: 30.0, description: "MAILCHIMP STANDARD", expected_category: "Marketing" },

  // Ambiguous / vendor noise
  { id: "txn-073", date: "2024-05-23", amount: 14.99, description: "SQ *MERCHANT 47C", expected_category: "Uncategorized" },
  { id: "txn-074", date: "2024-05-24", amount: 6.0, description: "POS TRANSACTION 4821", expected_category: "Uncategorized" },
  { id: "txn-075", date: "2024-05-25", amount: 27.0, description: "PAYPAL *VENDORNAMEX", expected_category: "Uncategorized" },

  // Insurance / utilities
  { id: "txn-076", date: "2024-05-26", amount: 180.0, description: "HISCOX BIZ LIABILITY", expected_category: "Operating Expenses" },
  { id: "txn-077", date: "2024-05-27", amount: 72.0, description: "COMCAST BUSINESS INTERNET", expected_category: "Operating Expenses" },
  { id: "txn-078", date: "2024-05-28", amount: 45.0, description: "AT&T WIRELESS BIZ LINE", expected_category: "Operating Expenses" },

  // Recurring SaaS with low-info merchant strings
  { id: "txn-079", date: "2024-05-29", amount: 7.99, description: "DSCRIPT.COM", expected_category: "Software & SaaS" },
  { id: "txn-080", date: "2024-05-30", amount: 12.0, description: "PROTON MAIL UNLIMITED", expected_category: "Software & SaaS" },

  // Refunds / negatives that aren't revenue
  { id: "txn-081", date: "2024-06-01", amount: -45.0, description: "AMAZON REFUND", expected_category: "Office Supplies" },
  { id: "txn-082", date: "2024-06-02", amount: -120.0, description: "GOOGLE ADS CREDIT", expected_category: "Advertising" },

  // Bank fees
  { id: "txn-083", date: "2024-06-03", amount: 35.0, description: "WIRE TRANSFER FEE", expected_category: "Operating Expenses" },
  { id: "txn-084", date: "2024-06-04", amount: 12.0, description: "FOREIGN TX FEE", expected_category: "Operating Expenses" },

  // Print / postage
  { id: "txn-085", date: "2024-06-05", amount: 29.0, description: "VISTAPRINT BUSINESS CARDS", expected_category: "Printing" },
  { id: "txn-086", date: "2024-06-06", amount: 18.0, description: "STAMPS.COM POSTAGE", expected_category: "Postage & Shipping" },

  // Events / education
  { id: "txn-087", date: "2024-06-07", amount: 450.0, description: "MICROCONF EUROPE TICKET", expected_category: "Marketing" },
  { id: "txn-088", date: "2024-06-08", amount: 99.0, description: "COURSE - SAAS MARKETING 101", expected_category: "Marketing" },

  // Office furniture
  { id: "txn-089", date: "2024-06-09", amount: 320.0, description: "IKEA DESK", expected_category: "Office & Admin" },
  { id: "txn-090", date: "2024-06-10", amount: 89.0, description: "TARGET CHAIR MAT", expected_category: "Office & Admin" },

  // Software, low-info
  { id: "txn-091", date: "2024-06-11", amount: 25.0, description: "GUMROAD PRO MONTHLY", expected_category: "Software & SaaS" },
  { id: "txn-092", date: "2024-06-12", amount: 12.0, description: "RAYCAST PRO MONTHLY", expected_category: "Software & SaaS" },
  { id: "txn-093", date: "2024-06-13", amount: 9.0, description: "BUTTONDOWN.EMAIL MONTHLY", expected_category: "Software & SaaS" },

  // Long-ambiguous descriptions
  { id: "txn-094", date: "2024-06-14", amount: 140.0, description: "ACH DEBIT 00482917 - QUICK BOOKS PAYM", expected_category: "Software & SaaS" },
  { id: "txn-095", date: "2024-06-15", amount: 199.0, description: "POS 4821 STORE #2241", expected_category: "Uncategorized" },

  // Misc
  { id: "txn-096", date: "2024-06-16", amount: 50.0, description: "USPS PO BOX RENEWAL", expected_category: "Postage & Shipping" },
  { id: "txn-097", date: "2024-06-17", amount: 60.0, description: "MEETUP.COM GROUP ANNUAL", expected_category: "Marketing" },
  { id: "txn-098", date: "2024-06-18", amount: 200.0, description: "INTERNAL TRANSFER - MAIN TO PAYROLL", expected_category: "Uncategorized" },
  { id: "txn-099", date: "2024-06-19", amount: 18.0, description: "APPLE STORE - APP PURCHASE", expected_category: "Software & SaaS" },
  { id: "txn-100", date: "2024-06-20", amount: 250.0, description: "STATE QUARTERLY ESTIMATED TAX", expected_category: "Operating Expenses" },
];
