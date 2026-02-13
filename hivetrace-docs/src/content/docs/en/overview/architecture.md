---
title: "Architecture"
sidebar:
  order: 2
draft: true
---

At a high level, HiveTrace includes:

- **SDK / Integration Layer** in your application (sending `input` / `output`)
- **Processing Service** (validation, policy application, enrichment)
- **Storage & Analytics** (filters, aggregation, investigation workflows)
- **Website** (apps, policies, alerts, users)

## Data Flow (Simplified)

1. Your app sends an `input` event (user message, metadata, optional files).
2. HiveTrace applies guardrails/custom policies and computes monitoring results.
3. Your app sends an `output` event (model response) to complete the trace.

:::tip
For a practical start, see **Quickstart** — it includes a minimal working example.
:::
