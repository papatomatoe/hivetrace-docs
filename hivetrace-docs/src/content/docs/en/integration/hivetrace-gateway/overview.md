---
title: "Overview"
sidebar:
  order: 1
---

## Purpose

HiveTrace Gateway (LiteLLM + HiveTrace) acts as a proxy layer between your application and an LLM provider.
Instead of calling OpenAI (or another provider) directly, your application calls the Gateway, which handles routing, monitoring, and policy enforcement.

Gateway:

- routes requests to models via LiteLLM
- analyzes incoming and outgoing messages
- applies security policies
- detects and masks sensitive data
- associates events with application, user, and session
- stores telemetry for audit and investigation

Gateway exposes an **OpenAI-compatible API**, which allows integration with minimal changes in client code.

---

## Architecture

Typical request flow:

```
Application → Gateway (LiteLLM) → LLM
                     ↓
                  HiveTrace
```

1. The application sends a request to the Gateway.
2. The Gateway forwards it to the target model via LiteLLM.
3. HiveTrace analyzes input and output.
4. Depending on configuration, the Gateway may:
   - allow the response,
   - modify it,
   - block it,
   - log the event for investigation.

---

## Integration Requirements

To use the Gateway, your application must:

- use `base_url` at the `/v1` level
  example:

  ```
  http://localhost:4100/v1
  ```

- send `Authorization: Bearer <LITELLM_MASTER_KEY>`
- send `X-Application-Id` (HiveTrace application UUID)
- send user and session identifiers

Gateway works with OpenAI SDK and any HTTP client compatible with Chat Completions API.

---

## Integration Modes

HiveTrace Gateway supports two primary modes:

1. Usage without multi-agents
2. Usage with multi-agents

The choice depends on your application architecture.
