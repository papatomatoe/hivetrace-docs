---
sidebar_position: 1
title: "Connecting Applications with a Single LLM (no agents)"
sidebar_label: "Single LLM"
---

## Single LLM

This page covers the **standard integration** for a non-agent LLM app: you send a user prompt to a model and return the model output.

HiveTrace sits at the model boundary and gives you two control points:

- **`input`**: what the user is sending to the model
- **`output`**: what the model is returning to the user

:::info
If you use agent frameworks (LangChain/CrewAI/OpenAI Agents), use the dedicated integrations in the SDK section.
:::

---

## Prerequisites

You’ll need:

1. Your HiveTrace **instance URL**
2. An **API access token** (created in the UI)
3. Your **`application_id`** (UUID from the UI)

---

## Installation

```bash
pip install hivetrace[base]
```

---

## Configuration

The SDK reads configuration from environment variables:

- `HIVETRACE_URL` — base URL of your HiveTrace instance (`http://` or `https://`)
- `HIVETRACE_ACCESS_TOKEN` — API token
- `HIVETRACE_APP_ID` — optional convenience alias for your `application_id`

Example `.env`:

```bash
HIVETRACE_URL=https://your-hivetrace-instance.com
HIVETRACE_ACCESS_TOKEN=your-access-token
HIVETRACE_APP_ID=your-application-id
```

Or pass config explicitly:

```python
from hivetrace import SyncHivetraceSDK

client = SyncHivetraceSDK(
    config={
        "HIVETRACE_URL": "https://your-hivetrace-instance.com",
        "HIVETRACE_ACCESS_TOKEN": "your-access-token",
    }
)
```

---

## Quick integration (recommended flow)

Enterprise-ready pattern:

1. **Inspect input**: `client.input(...)`
2. **Decide**: whether to call the LLM (and whether to use raw vs cleaned text)
3. **Call LLM**: your provider (OpenAI / local models / etc.)
4. **Inspect output**: `client.output(...)`
5. **Decide**: what to return to the end user

```python
from hivetrace import SyncHivetraceSDK

APP_ID = "your-application-id"

def is_flagged(result: dict) -> bool:
    mr = (result or {}).get("monitoring_result") or {}
    return bool(mr.get("guardrail_flagged") or mr.get("custom_flagged"))

def call_your_llm(prompt: str) -> str:
    # TODO: your LLM call (OpenAI, local model, etc.)
    return f"Model response to: {prompt}"

client = SyncHivetraceSDK()

user_message = "Hello from my app"

# 1) Input (user prompt)
input_result = client.input(
    application_id=APP_ID,
    message=user_message,
    additional_parameters={
        "session_id": "s-123",
        "user_id": "u-456",
        "environment": "prod",
        "llm_provider": "openai",
        "llm_model": "gpt-4.1-mini",
    },
)

if is_flagged(input_result):
    safe_reply = "Sorry — I can’t help with that request."
    client.output(application_id=APP_ID, message=safe_reply)
    raise SystemExit(safe_reply)

# 2) Call your LLM
assistant_message = call_your_llm(user_message)

# 3) Output (LLM response)
output_result = client.output(
    application_id=APP_ID,
    message=assistant_message,
    additional_parameters={
        "session_id": "s-123",
        "user_id": "u-456",
        "environment": "prod",
    },
)

if is_flagged(output_result):
    safe_reply = "Sorry — I can’t provide that answer."
    client.output(application_id=APP_ID, message=safe_reply)
    raise SystemExit(safe_reply)
```

:::tip
If you only need an allow/deny decision and don’t want HiveTrace to store message text, use `additional_parameters={"censor_only": true}`.
:::

---

## Clients: sync vs async

- `SyncHivetraceSDK` — sync runtimes (Flask/Django, background jobs)
- `AsyncHivetraceSDK` — async runtimes (FastAPI/async workers)

Both support context managers for clean resource handling.

### Resource management (Sync)

```python
from hivetrace import SyncHivetraceSDK

APP_ID = "your-application-id"

with SyncHivetraceSDK() as client:
    client.input(application_id=APP_ID, message="Hello")
```

### Resource management (Async)

```python
import asyncio
from hivetrace import AsyncHivetraceSDK

APP_ID = "your-application-id"

async def main():
    async with AsyncHivetraceSDK() as client:
        await client.input(application_id=APP_ID, message="Hello")

asyncio.run(main())
```

---

## Metadata (`additional_parameters`)

For a non-agent app, common fields are:

- `session_id` — ties `input`/`output` together
- `user_id` — traceability and analytics
- `environment` — prod/staging/dev
- `llm_provider`, `llm_model` — useful for investigations and A/Bs

```python
client.input(
    application_id=APP_ID,
    message="User prompt",
    additional_parameters={
        "session_id": "s-123",
        "user_id": "u-456",
        "environment": "prod",
        "llm_provider": "openai",
        "llm_model": "gpt-4.1-mini",
    },
)
```

---

## Files (`files`) — `input` only

Use attachments when users provide documents/context you want HiveTrace to analyze. Format:

`(filename: str, content: bytes, mime_type: str)`

```python
from pathlib import Path

files = [
    ("doc1.txt", Path("doc1.txt").read_bytes(), "text/plain"),
]

client.input(
    application_id=APP_ID,
    message="Please analyze the attachment",
    files=files,
)
```

:::note
At the moment, files are supported for **`input()`**. For `output()`, send only the model response text.
:::

---

## API: `input()` and `output()`

### `input()`

Sends a **user prompt** to HiveTrace.

- `application_id` — application UUID from the UI
- `message` — prompt text
- `additional_parameters` — optional metadata
- `files` — optional attachments (input only)

### `output()`

Sends an **LLM response** to HiveTrace.

- `application_id` — application UUID from the UI
- `message` — LLM response text
- `additional_parameters` — optional metadata

:::info
Typically you should send in `output()` the **exact text that the user sees** (after post-processing/filtering).
:::

---
