# Интеграция с OpenAI Agents

**Демонстрационный репозиторий**

[https://github.com/anntish/openai-agents-forge](https://github.com/anntish/openai-agents-forge)

### 1. Установка

```bash
pip install hivetrace[openai_agents]==1.3.5
```

---

### 2. Настройка окружения

Задайте переменные окружения (через `.env` или команду `export`):

```bash
HIVETRACE_URL=http://localhost:8000          # ваш адрес HiveTrace
HIVETRACE_ACCESS_TOKEN=ht_...                # ваш токен доступа HiveTrace
HIVETRACE_APPLICATION_ID=00000000-...-0000   # ваш ID приложения HiveTrace

SESSION_ID=
USERID=

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

---

### 3. Подключение Trace Processor в коде

Добавьте 3 строки перед созданием или использованием агентов:

```python
from agents import set_trace_processors
from hivetrace.adapters.openai_agents.tracing import HivetraceOpenAIAgentProcessor

set_trace_processors([
    HivetraceOpenAIAgentProcessor()  # берет конфигурацию из переменных окружения
])
```

Альтернатива (явная конфигурация, если не хотите использовать переменные окружения):

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

Важно:

* Регистрируйте процессор только один раз при старте приложения.
* Подключайте его до первого запуска агента (`Runner.run(...)` / `Runner.run_sync(...)`).

---

### 4. Минимальный пример «До/После»

До:

```python
from agents import Agent, Runner

assistant = Agent(name="Assistant", instructions="Be helpful.")
print(Runner.run_sync(assistant, "Hi!"))
```

После (с мониторингом HiveTrace):

```python
from agents import Agent, Runner, set_trace_processors
from hivetrace.adapters.openai_agents.tracing import HivetraceOpenAIAgentProcessor

set_trace_processors([HivetraceOpenAIAgentProcessor()])

assistant = Agent(name="Assistant", instructions="Be helpful.")
print(Runner.run_sync(assistant, "Hi!"))
```

С этого момента все вызовы агентов, передачи управления и вызовы инструментов будут логироваться в HiveTrace.

---

### 5. Трассировка инструментов

Если вы используете инструменты, декорируйте их с помощью `@function_tool`, чтобы их вызовы автоматически отслеживались:

```python
from agents import function_tool

@function_tool(description_override="Складывает два числа")
def calculate_sum(a: int, b: int) -> int:
    return a + b
```

Добавьте этот инструмент в `tools=[...]` вашего агента — и его вызовы появятся в HiveTrace с входными и выходными данными.
