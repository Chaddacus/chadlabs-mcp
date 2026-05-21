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

  // --- Extended corpus (inv-006..inv-020) ---

  {
    id: "inv-006-anthropic-api",
    email_from: "receipts@anthropic.com",
    email_subject: "Your Anthropic API receipt — March 2024",
    email_body: `Receipt for March 2024 API usage\n\nAccount: chad@example.com\nPeriod: 2024-03-01 to 2024-03-31\n\nUsage:\n  claude-sonnet-4-5 input  : 2,148,392 tokens  $6.45\n  claude-sonnet-4-5 output :   421,118 tokens  $6.32\n  claude-opus      input  :   140,000 tokens  $2.10\n  claude-opus      output :    18,400 tokens  $1.38\n\nTotal: $16.25\nPaid via card ending 4242\n\nQuestions? support@anthropic.com`,
    expected: { vendor_name: "Anthropic", vendor_normalized: "anthropic", amount_total: 16.25, currency: "USD", suggested_category: "Software & SaaS" },
  },
  {
    id: "inv-007-aws-monthly",
    email_from: "aws-billing@amazon.com",
    email_subject: "AWS Invoice 1023948 — March charges",
    email_body: `Amazon Web Services, Inc.\n\nInvoice Number: 1023948\nInvoice Date: 2024-04-02\nBilling Period: 2024-03-01 - 2024-03-31\n\nServices used:\n  EC2-Instance (t3.medium, us-east-1)   $48.22\n  S3 Standard Storage (124 GB)          $2.85\n  CloudFront data transfer              $14.50\n  Route 53 hosted zones (3)             $1.50\n  RDS db.t3.small                       $25.82\n\nSubtotal: $92.89\nTotal Due: $92.89 USD\nDue: 2024-04-30`,
    expected: { vendor_name: "Amazon Web Services", vendor_normalized: "amazon web services", amount_total: 92.89, currency: "USD", suggested_category: "Cloud Hosting" },
  },
  {
    id: "inv-008-eur-figma",
    email_from: "billing@figma.com",
    email_subject: "Figma — Receipt #FG-948231",
    email_body: `Figma\n\nReceipt #FG-948231\nDate: 2024-03-04\n\nProfessional Plan — 3 editors\nMonthly: €45.00\n\nVAT (0%): €0.00\nTotal: €45.00 EUR\n\nPaid via Visa ****4242`,
    expected: { vendor_name: "Figma", vendor_normalized: "figma", amount_total: 45.0, currency: "EUR", suggested_category: "Software & SaaS" },
  },
  {
    id: "inv-009-marriott-stay",
    email_from: "marriott@hotelmail.com",
    email_subject: "Folio for your recent stay at Marriott Marquis",
    email_body: `Marriott Marquis San Francisco\n780 Mission St, San Francisco, CA\n\nGuest: Chad Simon\nReservation: MAR-204918\nCheck-in: 2024-03-08    Check-out: 2024-03-09\n\nRoom & Tax:\n  King Premium Room       $129.00\n  Occupancy Tax           $15.48\n  Tourism Assessment      $4.52\n\nTotal Charged: $149.00 USD\nMethod: Visa ****4242`,
    expected: { vendor_name: "Marriott Marquis San Francisco", vendor_normalized: "marriott marquis san francisco", amount_total: 149.0, currency: "USD", suggested_category: "Travel" },
  },
  {
    id: "inv-010-uber-receipt",
    email_from: "noreply@uber.com",
    email_subject: "Thanks for tipping Carlos",
    email_body: `Trip with Carlos · 12 min · 4.8 mi\n\nTrip fare           $28.45\nBooking fee         $2.55\nTip                 $3.50\n\nTotal: $34.50\nPayment: Visa ****4242`,
    expected: { vendor_name: "Uber", vendor_normalized: "uber", amount_total: 34.5, currency: "USD", suggested_category: "Travel" },
  },
  {
    id: "inv-011-vercel-pro",
    email_from: "invoice+statements@vercel.com",
    email_subject: "Vercel Pro Receipt - March",
    email_body: `Hi Chad,\n\nYour Pro plan renewed on 2024-03-15.\n\nInvoice #VER-882134\nPro Plan (1 seat)                $20.00\nBandwidth overage (140 GB extra) $14.00\nFunction invocations             $0.00\n\nTotal: $34.00 USD\nNext renewal: 2024-04-15`,
    expected: { vendor_name: "Vercel", vendor_normalized: "vercel", amount_total: 34.0, currency: "USD", suggested_category: "Cloud Hosting" },
  },
  {
    id: "inv-012-legal-fees",
    email_from: "billing@westllp.com",
    email_subject: "Invoice #2024-0419 from West LLP",
    email_body: `WEST LLP — ATTORNEYS AT LAW\n\nClient: Chad Simon / ChadLabs\nInvoice #: 2024-0419\nDate: 2024-04-19\n\nFor professional services rendered:\n  Trademark search (TM-INTAKE)          4.5 hrs @ $400/hr = $1,800.00\n  Phone consultation re: SaaS terms     0.5 hrs @ $400/hr = $200.00\n\nTotal Due: $2,000.00 USD\nDue: NET 15`,
    expected: { vendor_name: "West LLP", vendor_normalized: "west llp", amount_total: 2000.0, currency: "USD", suggested_category: "Professional Fees" },
  },
  {
    id: "inv-013-stripe-no-explicit-amount",
    email_from: "noreply@stripe.com",
    email_subject: "Your Stripe payout has been deposited",
    email_body: `Hi there,\n\nA payout of $1,200.00 USD was sent to your bank account ending 8821 on 2024-04-22.\n\nIncludes 4 charges:\n  Customer A — Subscription           $290.00\n  Customer B — Subscription           $290.00\n  Customer C — One-time consult       $310.00\n  Customer D — Subscription           $310.00\n\nMinus fees: -$0.00 (already netted)\n\nQuestions? https://dashboard.stripe.com/payouts`,
    expected: { vendor_name: "Stripe", vendor_normalized: "stripe", amount_total: 1200.0, currency: "USD", suggested_category: "Services Revenue" },
  },
  {
    id: "inv-014-google-ads",
    email_from: "billing-noreply@google.com",
    email_subject: "Your Google Ads invoice — April 2024",
    email_body: `Google Ads — Invoice\n\nAccount: 123-456-7890\nInvoice Number: GA-87234001\nPeriod: 2024-04-01 to 2024-04-30\n\nClicks: 2,140\nImpressions: 184,000\nAverage CPC: $0.42\n\nSpend: $898.80\nVAT (0%): $0.00\nTotal: $898.80 USD`,
    expected: { vendor_name: "Google Ads", vendor_normalized: "google ads", amount_total: 898.8, currency: "USD", suggested_category: "Advertising" },
  },
  {
    id: "inv-015-gusto-payroll",
    email_from: "team@gusto.com",
    email_subject: "Your Gusto payroll has been processed",
    email_body: `Gusto Payroll Confirmation\n\nPay date: 2024-05-01\n\nTotal employer cost:\n  Net wages: $3,810.00\n  Employee taxes withheld: $390.00\n  Employer payroll taxes: $321.50\n\nGrand total debited: $4,521.50 USD\n\nFunds will be debited from acct ending 8821 on 2024-04-29.`,
    expected: { vendor_name: "Gusto", vendor_normalized: "gusto", amount_total: 4521.5, currency: "USD", suggested_category: "Salaries & Wages" },
  },
  {
    id: "inv-016-poorly-formatted",
    email_from: "info@randomvendor.co",
    email_subject: "URGENT - your invoice is overdue",
    email_body: `hello, this email is to remind you that invoice for services rendered last month totaling $475 is now overdue\n\nplease pay at your earliest\n\nthanks!\n- random vendor co`,
    expected: { vendor_name: "Random Vendor Co", vendor_normalized: "random vendor co", amount_total: 475.0, currency: "USD", suggested_category: "Operating Expenses" },
  },
  {
    id: "inv-017-cad-shopify",
    email_from: "billing@shopify.com",
    email_subject: "Shopify Plus Receipt",
    email_body: `Shopify Inc.\n\nReceipt for: chad-store.myshopify.com\nDate: 2024-05-03\n\nShopify Basic plan        CAD $39.00\nTransaction fees          CAD $14.20\n\nTotal: CAD $53.20\nPaid: Visa ****4242`,
    expected: { vendor_name: "Shopify", vendor_normalized: "shopify", amount_total: 53.2, currency: "CAD", suggested_category: "Software & SaaS" },
  },
  {
    id: "inv-018-cloudflare",
    email_from: "billing@cloudflare.com",
    email_subject: "Cloudflare Invoice #CF-294021",
    email_body: `Cloudflare, Inc.\n\nInvoice: CF-294021\nDate: 2024-04-30\n\nPro Plan (chadlabs.io)            $20.00\nWorkers Paid (10M requests)       $5.00\nR2 storage (40 GB)                $0.60\n\nTotal: $25.60 USD`,
    expected: { vendor_name: "Cloudflare", vendor_normalized: "cloudflare", amount_total: 25.6, currency: "USD", suggested_category: "Cloud Hosting" },
  },
  {
    id: "inv-019-gbp-newsletter-sponsor",
    email_from: "ads@indiehackers.co.uk",
    email_subject: "Sponsor placement confirmation",
    email_body: `Indie Hackers Newsletter — Sponsorship Placement\n\nIssue: 2024-05-15\nPlacement: Primary slot (top of email)\n\nFee: £450.00\nVAT (20%): £90.00\nTotal: £540.00 GBP\n\nPaid: Visa ****4242`,
    expected: { vendor_name: "Indie Hackers Newsletter", vendor_normalized: "indie hackers newsletter", amount_total: 540.0, currency: "GBP", suggested_category: "Advertising" },
  },
  {
    id: "inv-020-multi-line-printful",
    email_from: "orders@printful.com",
    email_subject: "Printful Order #PR-882134 has shipped",
    email_body: `Printful Order Confirmation\n\nOrder #: PR-882134\nDate: 2024-05-18\n\nLine items:\n  Unisex Heavy Cotton Tee (M)   x10  @ $11.99 = $119.90\n  Unisex Heavy Cotton Tee (L)   x10  @ $11.99 = $119.90\n  Custom front print fee        x20  @ $2.50  = $50.00\n\nShipping: $30.00\nTotal: $319.80 USD\n\nEstimated delivery: 2024-05-26`,
    expected: { vendor_name: "Printful", vendor_normalized: "printful", amount_total: 319.8, currency: "USD", suggested_category: "Direct Materials" },
  },
];
