# OpenAI Agents Integration

**Demo repository**

[https://github.com/anntish/openai-agents-forge](https://github.com/anntish/openai-agents-forge)

### 1. Installation

```bash
pip install hivetrace[openai_agents]==1.3.5
```

---

### 2. Environment Setup

Set the environment variables (via `.env` or export):

```bash
HIVETRACE_URL=http://localhost:8000          # Your HiveTrace URL
HIVETRACE_ACCESS_TOKEN=ht_...                # Your HiveTrace access token
HIVETRACE_APPLICATION_ID=00000000-...-0000   # Your HiveTrace application ID

SESSION_ID=
USERID=

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

---

### 3. Attach the Trace Processor in Code

Add 3 lines before creating/using your agents:

```python
from agents import set_trace_processors
from hivetrace.adapters.openai_agents.tracing import HivetraceOpenAIAgentProcessor

set_trace_processors([
    HivetraceOpenAIAgentProcessor()  # will take config from env
])
```

Alternative (explicit configuration if you don’t want to rely on env):

```python
from agents import set_trace_processors
from hivetrace import SyncHivetraceSDK
from hivetrace.adapters.openai_agents.tracing import HivetraceOpenAIAgentProcessor

hivetrace = SyncHivetraceSDK(config={
    "HIVETRACE_URL": "http://localhost:8000",
    "HIVETRACE_ACCESS_TOKEN": "ht_...",
})

set_trace_processors([
    HivetraceOpenAIAgentProcessor(
        application_id="00000000-0000-0000-0000-000000000000",
        hivetrace_instance=hivetrace,
    )
])
```

Important:

* Register the processor only once at app startup.
* Attach it before the first agent run (`Runner.run(...)` / `Runner.run_sync(...)`).

---

### 4. Minimal "Before/After" Example

Before:

```python
from agents import Agent, Runner

assistant = Agent(name="Assistant", instructions="Be helpful.")
print(Runner.run_sync(assistant, "Hi!"))
```

After (with HiveTrace monitoring):

```python
from agents import Agent, Runner, set_trace_processors
from hivetrace.adapters.openai_agents.tracing import HivetraceOpenAIAgentProcessor

set_trace_processors([HivetraceOpenAIAgentProcessor()])

assistant = Agent(name="Assistant", instructions="Be helpful.")
print(Runner.run_sync(assistant, "Hi!"))
```

From this moment, all agent calls, handoffs, and tool invocations will be logged in HiveTrace.

---

### 5. Tool Tracing

If you use tools, decorate them with `@function_tool` so their calls are automatically traced:

```python
from agents import function_tool

@function_tool(description_override="Adds two numbers")
def calculate_sum(a: int, b: int) -> int:
    return a + b
```

Add this tool to your agent’s `tools=[...]` — and its calls will appear in HiveTrace with inputs/outputs.

---
