---
title: "Processing flow"
sidebar_position: 2
---

# Processing flow

Below is a simplified model of how events move through HiveTrace.

## 1) Input

Your app sends an `input` event:

- user message
- `application_id`
- optional metadata (session, user, agents)

## 2) Policy application

HiveTrace applies guardrails and custom policies and returns a `monitoring_result`:

- violation flags
- token counters / severity (if enabled)
- signals for alerts and investigations

## 3) Output

To complete the trace, send the `output` event (the model response). This improves investigation workflows and end-to-end visibility.

