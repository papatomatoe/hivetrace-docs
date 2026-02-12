# Integration with LangChain

**Demo repository**

[https://github.com/anntish/multiagents-langchain-forge](https://github.com/anntish/multiagents-langchain-forge)

This project implements monitoring of a multi-agent system in LangChain via the HiveTrace SDK.

### Step 1. Install Dependencies

```bash
pip install hivetrace[langchain]>=1.3.5
# optional: add to requirements.txt and install
echo "hivetrace[langchain]>=1.3.3" >> requirements.txt
pip install -r requirements.txt
```

What the package provides: SDK clients (sync/async), a universal callback for LangChain agents, and ready-to-use calls for sending inputs/logs/outputs to HiveTrace.

### Step 2. Configure Environment Variables

* `HIVETRACE_URL`: HiveTrace address
* `HIVETRACE_ACCESS_TOKEN`: HiveTrace access token
* `HIVETRACE_APP_ID`: your application ID in HiveTrace
* `OPENAI_API_KEY`: key for the LLM provider (example with OpenAI)
* Additionally: `OPENAI_MODEL`, `USER_ID`, `SESSION_ID`

### Step 3. Assign Fixed UUIDs to Your Agents

Create a dictionary of fixed UUIDs for all "agent nodes" (e.g., orchestrator, specialized agents). This ensures unambiguous identification in tracing.

Example: file `src/core/constants.py`:

```python
PREDEFINED_AGENT_IDS = {
    "MainHub": "111e1111-e89b-12d3-a456-426614174099",
    "text_agent": "222e2222-e89b-12d3-a456-426614174099",
    "math_agent": "333e3333-e89b-12d3-a456-426614174099",
    "pre_text_agent": "444e4444-e89b-12d3-a456-426614174099",
    "pre_math_agent": "555e5555-e89b-12d3-a456-426614174099",
}
```

Tip: dictionary keys must match the actual node names appearing in logs (`tool`/agent name in LangChain calls).

### Step 4. Attach the Callback to Executors and Tools

Create and use `AgentLoggingCallback` — it should be passed:

* as a callback in `AgentExecutor` (orchestrator), and
* as `callback_handler` in your tools/agent wrappers (`BaseTool`).

Example: file `src/core/orchestrator.py` (fragment):

```python
from hivetrace.adapters.langchain import AgentLoggingCallback
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

class OrchestratorAgent:
    def __init__(self, llm, predefined_agent_ids=None):
        self.llm = llm
        self.logging_callback = AgentLoggingCallback(
            default_root_name="MainHub",
            predefined_agent_ids=predefined_agent_ids,
        )
        # Example: wrapper agents as tools
        # MathAgentTool/TextAgentTool internally pass self.logging_callback further
        agent = create_openai_tools_agent(self.llm, self.tools, ChatPromptTemplate.from_messages([
            ("system", "You are the orchestrator agent of a multi-agent system."),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]))
        self.executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            callbacks=[self.logging_callback],
        )
```

Important: all nested agents/tools that create their own `AgentExecutor` or inherit from `BaseTool` must also receive this `callback_handler` so their steps are included in tracing.

### Step 5. One-Line Integration in a Business Method

Use the `run_with_tracing` helper from `hivetrace/adapters/langchain/api.py`. It:

* logs the input with agent mapping and metadata;
* calls your orchestrator;
* collects and sends accumulated logs/final answer.

Minimal example (script):

```python
import os, uuid
from langchain_openai import ChatOpenAI
from src.core.orchestrator import OrchestratorAgent
from src.core.constants import PREDEFINED_AGENT_IDS
from hivetrace.adapters.langchain import run_with_tracing

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"), temperature=0.2, streaming=False)
orchestrator = OrchestratorAgent(llm, predefined_agent_ids=PREDEFINED_AGENT_IDS)

result = run_with_tracing(
    orchestrator=orchestrator,
    query="Format this text and count the number of words",
    application_id=os.getenv("HIVETRACE_APP_ID"),
    user_id=os.getenv("USER_ID"),
    session_id=os.getenv("SESSION_ID"),
    conversation_id=str(uuid.uuid4()),
)
print(result)
```

FastAPI variant (handler fragment):

```python
from fastapi import APIRouter, Request
from hivetrace.adapters.langchain import run_with_tracing
import uuid

router = APIRouter()

@router.post("/query")
async def process_query(payload: dict, request: Request):
    orchestrator = request.app.state.orchestrator
    conv_id = str(uuid.uuid4()) # always create a new agent_conversation_id for each request to group agent work for the same question
    result = run_with_tracing(
        orchestrator=orchestrator,
        query=payload["query"],
        application_id=request.app.state.HIVETRACE_APP_ID,
        user_id=request.app.state.USER_ID,
        session_id=request.app.state.SESSION_ID,
        conversation_id=conv_id,
    )
    return {"status": "success", "result": result}
```

### Step 6. Reusing the HiveTrace Client (Optional)

Helpers automatically create a short-lived client if none is provided. If you want to reuse a client — create it once during the application's lifecycle and pass it to helpers.

FastAPI (lifespan):

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from hivetrace import SyncHivetraceSDK

@asynccontextmanager
async def lifespan(app: FastAPI):
    hivetrace = SyncHivetraceSDK()
    app.state.hivetrace = hivetrace
    try:
        yield
    finally:
        hivetrace.close()

app = FastAPI(lifespan=lifespan)
```

Then:

```python
result = run_with_tracing(
    orchestrator=orchestrator,
    query=payload.query,
    hivetrace=request.app.state.hivetrace,  # pass your own client
    application_id=request.app.state.HIVETRACE_APP_ID,
)
```

### How Logs Look in HiveTrace

* **Agent nodes**: orchestrator nodes and specialized "agent wrappers" (`text_agent`, `math_agent`, etc.).
* **Actual tools**: low-level tools (e.g., `text_analyzer`, `text_formatter`) are logged on start/end events.
* **Service records**: automatically added `return_result` (returning result to parent) and `final_answer` (final answer of the root node) steps.

This gives a clear call graph with data flow direction and the final answer.

### Common Mistakes and How to Avoid Them

* **Name mismatch**: key in `PREDEFINED_AGENT_IDS` must match the node/tool name in logs.
* **No agent mapping**: either pass `agents_mapping` to `run_with_tracing` or define `predefined_agent_ids` in `AgentLoggingCallback` — the SDK will build the mapping automatically.
* **Callback not attached**: add `AgentLoggingCallback` to all `AgentExecutor` and `BaseTool` wrappers via the `callback_handler` parameter.
* **Client not closed**: use lifespan/context manager for `SyncHivetraceSDK`.
