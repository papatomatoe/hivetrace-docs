---
title: "Single LLM"
sidebar:
  order: 2
---

## Purpose

This mode is intended for classic LLM applications where:

- the application sends `messages`,
- the model generates a response,
- no agent orchestration is used,
- no tool calls are involved.

The Gateway operates as a transparent proxy with monitoring.

---

## When to Use

Use this mode if:

- you need centralized input/output control,
- you apply security policies,
- you require audit logging,
- your application implements a standard chat flow.

---

## Prerequisites

Required parameters:

- **GATEWAY_URL** — base URL at `/v1` level
  example:

  ```
  http://localhost:4100/v1
  ```

- **LITELLM_MASTER_KEY** — Gateway authorization key

- **HIVETRACE_APPLICATION_ID** — application UUID

- **USER_ID** — user identifier

- **SESSION_ID** — session identifier

Important: `GATEWAY_URL` must point to `/v1`, not `/v1/chat/completions`.

---

## Required Headers

Minimum required:

- `Authorization: Bearer <LITELLM_MASTER_KEY>`
- `X-Application-Id: <HIVETRACE_APPLICATION_ID>`
- `X-User-Id` or `X-OpenWebUI-User-Id`
- `X-Session-Id` or `X-OpenWebUI-Chat-Id`

These headers allow proper telemetry correlation in HiveTrace.

---

## Example (Python)

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["GATEWAY_URL"].rstrip("/"),
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
    },
)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "Explain HiveTrace briefly."}],
)

print(response.choices[0].message.content)
```

---

## Example (curl)

```bash
curl -X POST "$GATEWAY_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "X-Application-Id: $HIVETRACE_APPLICATION_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "X-Session-Id: $SESSION_ID" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [{"role":"user","content":"Hello from my app"}]
  }'
```

---

## Result

From the application perspective, behavior is identical to OpenAI API, with additional monitoring and policy enforcement.
