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
];
