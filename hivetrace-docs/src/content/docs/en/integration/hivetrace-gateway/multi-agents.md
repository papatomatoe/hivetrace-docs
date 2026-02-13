---
title: "Multi-agents"
sidebar:
  order: 3
---

## Purpose

This mode is used in applications implementing multi-agent architectures where models may:

- plan multi-step reasoning,
- invoke tools,
- exchange context,
- generate final responses.

---

## Architectural Principle

Responsibility separation:

- **LLM calls go through the Gateway**
- **Tools execute locally in your application**
- **HiveTrace analyzes only LLM requests and responses**

Gateway does not execute tools and does not orchestrate agents.

---

## What Changes When Switching from OpenAI to Gateway

### Endpoint

Before:

```python
base_url="https://api.openai.com/v1"
```

With Gateway:

```python
base_url=$GATEWAY_URL  # e.g. http://host:4100/v1
```

Must point strictly to `/v1`.

---

### API Key

Before:

```python
api_key=$OPENAI_API_KEY
```

With Gateway:

```python
api_key=$LITELLM_MASTER_KEY
```

---

### Required Headers for HiveTrace

```
X-Application-Id: <HIVETRACE_APPLICATION_ID>
X-User-Id: <USER_ID>
X-Session-Id: <SESSION_ID>
```

Optional:

```
X-HiveTrace-Mode: sync | async
X-HiveTrace-Skip-System-Requests: false
```

For multi-agent systems, typically:

```
X-HiveTrace-Skip-System-Requests: false
```

to preserve system instructions for audit.

---

## Telemetry Behavior

Agents may perform multiple LLM calls per user request:

- planning
- tool calls
- continuation
- final response

Gateway configuration:

```bash
HIVETRACE_DEDUP_AGENT_TOOL_CALLS=true
HIVETRACE_SKIP_SYSTEM_REQUESTS=false
```

Prevents duplicate user input records and preserves system context.

---

## Tools

Tools:

- execute locally
- are not proxied through Gateway
- are invisible to HiveTrace except through LLM I/O

---

## Minimal Example

```python
import os
import httpx
from openai import AsyncOpenAI
from agents import Agent, Runner, function_tool
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel

@function_tool
def fetch_users_summary():
    return {"total": 123}

openai_client = AsyncOpenAI(
    base_url=os.environ["GATEWAY_URL"],
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
    },
)

model = OpenAIChatCompletionsModel(
    model="gpt-4.1-mini",
    openai_client=openai_client
)

agent = Agent(
    name="Assistant",
    instructions="Call fetch_users_summary then respond.",
    tools=[fetch_users_summary],
    model=model,
)

result = await Runner.run(agent, input=[{"role": "user", "content": "How many users?"}])
print(result.final_output)
```

---

## Summary

To enable multi-agents with Gateway:

1. Change `base_url`
2. Use `LITELLM_MASTER_KEY`
3. Add HiveTrace headers
4. Configure Gateway telemetry env variables

Agent runtime and tool logic remain unchanged.
