# invoice_extract — accuracy benchmark

- mode: `mock`
- generated: 2026-05-21T07:53:28.053Z
- corpus: 20 synthetic invoice emails

## Field-level accuracy

| Field | Hits | Total | Accuracy | Threshold | Pass |
|---|---|---|---|---|---|
| vendor.normalized_name | 19 | 20 | 95.0% | 85% | ✅ |
| amount_total | 19 | 20 | 95.0% | 95% | ✅ |
| currency | 20 | 20 | 100.0% | 95% | ✅ |
| suggested_category | 19 | 20 | 95.0% | 80% | ✅ |

## Per-fixture results

| ID | vendor | amount | currency | category | notes |
|---|---|---|---|---|---|
| inv-001-clean-saas | ✅ | ✅ | ✅ | ✅ |  |
| inv-002-aws | ❌ | ❌ | ✅ | ❌ |  |
| inv-003-noisy-thanks | ✅ | ✅ | ✅ | ✅ |  |
| inv-004-foreign-currency | ✅ | ✅ | ✅ | ✅ |  |
| inv-005-minimal-garbage | ✅ | ✅ | ✅ | ✅ |  |
| inv-006-anthropic-api | ✅ | ✅ | ✅ | ✅ |  |
| inv-007-aws-monthly | ✅ | ✅ | ✅ | ✅ |  |
| inv-008-eur-figma | ✅ | ✅ | ✅ | ✅ |  |
| inv-009-marriott-stay | ✅ | ✅ | ✅ | ✅ |  |
| inv-010-uber-receipt | ✅ | ✅ | ✅ | ✅ |  |
| inv-011-vercel-pro | ✅ | ✅ | ✅ | ✅ |  |
| inv-012-legal-fees | ✅ | ✅ | ✅ | ✅ |  |
| inv-013-stripe-no-explicit-amount | ✅ | ✅ | ✅ | ✅ |  |
| inv-014-google-ads | ✅ | ✅ | ✅ | ✅ |  |
| inv-015-gusto-payroll | ✅ | ✅ | ✅ | ✅ |  |
| inv-016-poorly-formatted | ✅ | ✅ | ✅ | ✅ |  |
| inv-017-cad-shopify | ✅ | ✅ | ✅ | ✅ |  |
| inv-018-cloudflare | ✅ | ✅ | ✅ | ✅ |  |
| inv-019-gbp-newsletter-sponsor | ✅ | ✅ | ✅ | ✅ |  |
| inv-020-multi-line-printful | ✅ | ✅ | ✅ | ✅ |  |
