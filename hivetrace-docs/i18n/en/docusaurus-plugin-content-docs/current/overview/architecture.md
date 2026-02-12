---
title: "Architecture"
sidebar_position: 2
---

# Architecture

At a high level, HiveTrace includes:

- **SDK / integration layer** in your application (sending `input` / `output`)
- **Processing service** (validation, policy application, enrichment)
- **Storage & analytics** (filters, aggregation, investigation workflows)
- **Website** (apps, policies, alerts, users)

## Data flow (simplified)

1. Your app sends an `input` event (user message, metadata, optional files).
2. HiveTrace applies guardrails/custom policies and computes monitoring results.
3. Your app sends an `output` event (model response) to complete the trace.

:::tip
For a practical start, see **Quickstart** — it includes a minimal working example.
:::

