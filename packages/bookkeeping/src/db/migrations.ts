import type { Migration } from "../__core_shim__.js";

export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_transactions",
    sql: `
      CREATE TABLE IF NOT EXISTS transactions (
        id               TEXT PRIMARY KEY,
        date             TEXT NOT NULL,
        amount           REAL NOT NULL,
        currency         TEXT NOT NULL DEFAULT 'USD',
        description      TEXT NOT NULL,
        account          TEXT,
        category         TEXT,
        confidence       REAL,
        status           TEXT NOT NULL DEFAULT 'uncategorized',
        raw_payload_json TEXT,
        classified_at    TEXT,
        created_at       TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    version: 2,
    name: "create_vendors",
    sql: `
      CREATE TABLE IF NOT EXISTS vendors (
        id               TEXT PRIMARY KEY,
        name             TEXT NOT NULL,
        normalized_name  TEXT NOT NULL UNIQUE,
        default_category TEXT,
        notes            TEXT
      );
    `,
  },
  {
    version: 3,
    name: "create_categories",
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        name        TEXT PRIMARY KEY,
        parent      TEXT REFERENCES categories(name),
        description TEXT
      );
    `,
  },
  {
    version: 4,
    name: "create_chase_log",
    sql: `
      -- transaction_id is an external reference (transactions live in the
      -- host LLM's context / the bookkeeper's PMS — not necessarily in our
      -- local transactions table), so it is NOT a foreign key.
      CREATE TABLE IF NOT EXISTS chase_log (
        id             TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        client_email   TEXT NOT NULL,
        draft_subject  TEXT NOT NULL,
        draft_body     TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'draft',
        sent_at        TEXT,
        resolved_at    TEXT
      );
    `,
  },
  {
    version: 5,
    name: "seed_categories",
    sql: `
      INSERT OR IGNORE INTO categories (name, parent, description) VALUES
        -- Revenue
        ('Revenue', NULL, 'Top-level revenue'),
        ('Services Revenue', 'Revenue', 'Professional services income'),
        ('Product Revenue', 'Revenue', 'Physical or digital product sales'),
        ('Other Revenue', 'Revenue', 'Miscellaneous income'),

        -- Cost of Goods Sold
        ('COGS', NULL, 'Cost of goods sold'),
        ('Direct Labor', 'COGS', 'Labor directly tied to service delivery'),
        ('Subcontractors', 'COGS', 'Third-party contractors for client work'),
        ('Direct Materials', 'COGS', 'Materials consumed in service delivery'),

        -- Operating Expenses
        ('Operating Expenses', NULL, 'General operating costs'),

        -- Office & Admin
        ('Office & Admin', 'Operating Expenses', 'Office supplies and admin costs'),
        ('Office Supplies', 'Office & Admin', 'Paper, pens, toner, etc.'),
        ('Postage & Shipping', 'Office & Admin', 'Postage, courier, shipping'),
        ('Printing', 'Office & Admin', 'Printing and document costs'),

        -- Technology
        ('Technology', 'Operating Expenses', 'Software, SaaS, hardware'),
        ('Software & SaaS', 'Technology', 'Subscriptions to software tools'),
        ('Hardware', 'Technology', 'Computers, phones, peripherals'),
        ('Cloud Hosting', 'Technology', 'AWS, GCP, hosting fees'),
        ('Domain & Website', 'Technology', 'Domain registration, website costs'),

        -- Travel & Meals
        ('Travel & Meals', 'Operating Expenses', 'Business travel and client meals'),
        ('Travel', 'Travel & Meals', 'Airfare, hotel, ground transport'),
        ('Meals & Entertainment', 'Travel & Meals', 'Business meals and entertainment'),

        -- Marketing
        ('Marketing', 'Operating Expenses', 'Marketing and advertising'),
        ('Advertising', 'Marketing', 'Paid ads, promotions'),
        ('Professional Fees', 'Operating Expenses', 'Legal, accounting, consulting'),

        -- Payroll & Benefits
        ('Payroll & Benefits', 'Operating Expenses', 'Employee costs'),
        ('Salaries & Wages', 'Payroll & Benefits', 'W-2 employee pay'),
        ('Payroll Taxes', 'Payroll & Benefits', 'Employer payroll tax obligations'),
        ('Benefits', 'Payroll & Benefits', 'Health, dental, 401k'),

        -- Other
        ('Other Expenses', 'Operating Expenses', 'Uncategorized operating expenses'),
        ('Uncategorized', NULL, 'Not yet classified');
    `,
  },
];
