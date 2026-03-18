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

## Working with Files

If you need to attach a file to a message, you must include the following header:

- `-H "X-Attached-Files: <JSON-FILE>"`

The JSON must contain the following fields for each file:

- `"name"`
- `"content_base64"`
- `"type"`

You should also add the `request_id` parameter to the request body to unambiguously associate the file(s) with a specific message.

### Example (Python)

```python
import base64
import json
import os
from openai import OpenAI

file_path = "image.png"
with open(file_path, "rb") as f:
    content_b64 = base64.standard_b64encode(f.read()).decode("ascii")

attached = [
    {
        "name": os.path.basename(file_path),
        "content_base64": content_b64,
        "type": "image/png",
    }
]
attached_json = json.dumps(attached)

client = OpenAI(
    base_url=os.environ["GATEWAY_URL"].rstrip("/"),
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
        "X-Attached-Files": attached_json,
    },
)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "Analyze the image"}],
)

print(response.choices[0].message.content)
```

## Example (curl)

```bash
curl -X POST "$GATEWAY_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "X-Application-Id: $HIVETRACE_APPLICATION_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "X-Session-Id: $SESSION_ID" \
  -H "X-Attached-Files: $ATTACHED_JSON_2" \
  -d '{
    "model": "gpt-4.1-mini",
    "metadata": {"request_id": "'"$REQ_ID_2"'"},
    "messages": [{"role":"user","content":"Analyze the image"}]
  }'
```

---

## Result

From the application perspective, behavior is identical to OpenAI API, with additional monitoring and policy enforcement.
