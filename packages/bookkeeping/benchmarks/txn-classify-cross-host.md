# txn_classify — cross-host evaluation

- generated: 2026-05-21T08:54:59.695Z
- providers run: openrouter
## OpenRouter — `anthropic/claude-sonnet-4.5`

- prompt: `txn_classify`
- corpus: 20 fixtures (single batched request)
- total latency: 12.59s
- tokens: in=1962 out=1265

| Hits | Total | Accuracy | Threshold | Pass |
|---|---|---|---|---|
| 20 | 20 | 100.0% | 85% | ✅ |
