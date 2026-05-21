export interface InvoiceFixture {
  id: string;
  email_from: string;
  email_subject: string;
  email_body: string;
  /** Expected extraction result (used in mock fn) */
  expected: {
    vendor_name: string;
    vendor_normalized: string;
    amount_total: number;
    currency: string;
    suggested_category: string;
  };
}

export const invoiceFixtures: InvoiceFixture[] = [
  {
    id: "inv-001-clean-saas",
    email_from: "billing@notion.so",
    email_subject: "Your Notion invoice #INV-2024-0391",
    email_body: `
Hi Chad,

Thank you for being a Notion customer!

Invoice #: INV-2024-0391
Issue Date: 2024-03-01
Due Date: 2024-03-15

Line Items:
  Notion Plus Plan (1 seat) ......... $16.00/mo

Subtotal: $16.00
Tax (0%): $0.00
Total Due: $16.00 USD

Please pay by March 15, 2024.

Questions? Reply to this email or visit notion.so/billing.

— The Notion Team
    `.trim(),
    expected: {
      vendor_name: "Notion",
      vendor_normalized: "notion",
      amount_total: 16.0,
      currency: "USD",
      suggested_category: "Software & SaaS",
    },
  },

  {
    id: "inv-002-aws",
    email_from: "aws-receivables-support@email.amazon.com",
    email_subject: "Your AWS invoice for March 2024",
    email_body: `
AWS Invoice

Account ID: 123456789012
Invoice Date: 2024-03-31
Invoice Number: 1234567890

Service Charges:
  Amazon EC2 - Compute      $48.22
  Amazon S3 - Storage        $3.17
  Amazon RDS                $12.50
  Support (Developer)       $29.00

Total: $92.89 USD

This invoice is for usage between 2024-03-01 and 2024-03-31.
    `.trim(),
    expected: {
      vendor_name: "Amazon Web Services",
      vendor_normalized: "amazon web services",
      amount_total: 92.89,
      currency: "USD",
      suggested_category: "Cloud Hosting",
    },
  },

  {
    id: "inv-003-noisy-thanks",
    email_from: "invoices@freshbooks.com",
    email_subject: "Thanks for your business! Invoice #FB-8821 from Acme Design Co",
    email_body: `
Hi there!

Woo-hoo! 🎉 Thanks so much for trusting us with your project. It was a pleasure
working with you. Below is your invoice summary.

INVOICE FROM: Acme Design Co
Invoice #: FB-8821
Date: April 10, 2024

---
Logo Redesign (5 hrs @ $150/hr)  $750.00
Brand Guidelines Document         $200.00
---
Subtotal: $950.00
Discount: -$50.00
TOTAL DUE: $900.00 USD

Due by: April 24, 2024

Pay online: https://freshbooks.com/pay/FB-8821

Thanks again! We love our clients. ❤️
    `.trim(),
    expected: {
      vendor_name: "Acme Design Co",
      vendor_normalized: "acme design co",
      amount_total: 900.0,
      currency: "USD",
      suggested_category: "Professional Fees",
    },
  },

  {
    id: "inv-004-foreign-currency",
    email_from: "accounts@contractor.ca",
    email_subject: "Invoice INV-2024-CA-012 from Northlight Consulting",
    email_body: `
Northlight Consulting Ltd.
123 Bay Street, Toronto ON M5J 2T3

INVOICE
Invoice Number: INV-2024-CA-012
Invoice Date: 2024-04-01
Due Date: 2024-04-15

Bill To: Chad Simon

Services Rendered:
  Technical Writing (March 2024)  CAD 1,200.00
  Research & Review (8 hrs)       CAD   480.00

Total: CAD 1,680.00

Bank Transfer details enclosed. Please reference invoice number.
    `.trim(),
    expected: {
      vendor_name: "Northlight Consulting",
      vendor_normalized: "northlight consulting",
      amount_total: 1680.0,
      currency: "CAD",
      suggested_category: "Professional Fees",
    },
  },

  {
    id: "inv-005-minimal-garbage",
    email_from: "no-reply@squareup.com",
    email_subject: "Receipt from Coffee Corner",
    email_body: `
Square Receipt

Coffee Corner
456 Main St

Thank you for your purchase!

Latte x1         $5.50
Muffin x1        $3.25
Tax              $0.68

Total: $9.43

Paid: Visa ending 4242
    `.trim(),
    expected: {
      vendor_name: "Coffee Corner",
      vendor_normalized: "coffee corner",
      amount_total: 9.43,
      currency: "USD",
      suggested_category: "Meals & Entertainment",
    },
  },
];
