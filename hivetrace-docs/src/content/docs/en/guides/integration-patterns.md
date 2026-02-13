---
title: "Integration Patterns"
sidebar:
  order: 2
draft: true
---

## Pattern 1: Middleware Around the Model Call

Send `input` before calling the model and `output` immediately after you receive the response.

## Pattern 2: Async Delivery (latency-sensitive paths)

If your critical path is latency-sensitive, send events asynchronously, but keep correlation with `session_id` / `user_id`.

:::warning
Async delivery complicates delivery guarantees. For critical setups, implement retry/backoff and monitor SDK errors.
:::
