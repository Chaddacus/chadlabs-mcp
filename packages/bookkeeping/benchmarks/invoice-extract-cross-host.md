# invoice_extract — cross-host evaluation

- generated: 2026-05-21T08:54:01.560Z
- providers run: openrouter
## OpenRouter — `anthropic/claude-sonnet-4.5`

- prompt: `invoice_extract`
- corpus: 10 fixtures
- total latency: 43.86s
- tokens: in=13584 out=2972

| Field | Hits | Total | Accuracy | Threshold | Pass |
|---|---|---|---|---|---|
| vendor.normalized_name | 9 | 10 | 90.0% | 85% | ✅ |
| amount_total | 10 | 10 | 100.0% | 95% | ✅ |
| currency | 10 | 10 | 100.0% | 95% | ✅ |
| suggested_category | 8 | 10 | 80.0% | 80% | ✅ |

### Failures

| Fixture | vendor | amount | currency | category | notes |
|---|---|---|---|---|---|
| inv-gusto | ✓ | ✓ | ✓ | ✗ |  |
| inv-poorly-formatted | ✗ | ✓ | ✓ | ✗ |  |
