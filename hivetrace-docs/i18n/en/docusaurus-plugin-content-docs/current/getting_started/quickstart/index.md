---
title: "Quickstart"
sidebar_position: 1
description: "A minimal HiveTrace integration in under 5 minutes"
---

# Quickstart (under 5 minutes)

Goal: wire a minimal integration and send your **first `input`/`output`** to HiveTrace.

## 1) Prepare access

1. In the HiveTrace dashboard, create an **API token**.
2. Make sure you have your HiveTrace **instance URL**.

See: [Create API tokens](/getting_started/integration).

## 2) Install the SDK

```bash
pip install hivetrace[base]
```

## 3) Make your first call

```python
from hivetrace import SyncHivetraceSDK

client = SyncHivetraceSDK()

# 1) User input
input_result = client.input(
    application_id="your-application-id",
    message="Hello from my app",
)

# 2) LLM output (send your model response)
output_result = client.output(
    application_id="your-application-id",
    message="Hello from the model",
)

print(input_result["status"], output_result["status"])
```

:::info
The SDK reads configuration from environment variables (`HIVETRACE_URL`, `HIVETRACE_ACCESS_TOKEN`). This example assumes they are already set.
:::

## Next steps

- Set up your app in the UI: [Application setup](/getting_started/app-setup)
- Configure baseline protection: [Policy setup](/getting_started/policy-setup)
- Enable monitoring: [Monitoring and control](/getting_started/monitoring)

