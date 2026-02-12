---
title: "Мультиагенты"
sidebar_position: 3
---

## Использование с мультиагентами (RU)

### Назначение

Данный режим используется в приложениях с мультиагентной архитектурой, где модели могут:

* планировать последовательность действий,
* вызывать инструменты (tools),
* обмениваться контекстом,
* выполнять многошаговое рассуждение,
* формировать финальные ответы.

---

### Архитектурный принцип

Важно разделять зоны ответственности:

* **LLM вызывается через Gateway**
* **Tools выполняются локально в вашем приложении**
* **HiveTrace анализирует только запросы и ответы модели**

Gateway не выполняет инструменты и не участвует в orchestration агентов.

---

### Когда использовать

Режим рекомендуется, если:

* используется OpenAI Agents SDK или совместимый агентный runtime,
* в системе задействовано несколько агентов,
* применяются tool calls,
* требуется контроль входных и выходных данных модели,
* важны аудит и расследование действий агента.

---

### Что меняется при использовании Gateway вместо прямого OpenAI

При переходе с `api.openai.com` меняется только сетевой слой клиента и параметры идентификации.
Агентная архитектура, runtime и инструменты остаются без изменений.

---

#### Endpoint

**Было:**

```python
base_url="https://api.openai.com/v1"
```

**С Gateway:**

```python
base_url=$GATEWAY_URL
```

Требования:

* `base_url` должен указывать строго на уровень `/v1`
* пример:

  ```
  http://<gateway-host>:4100/v1
  ```
* не используйте полный endpoint (`/v1/chat/completions`)

---

#### API-ключ

**Было:**

```python
api_key=$OPENAI_API_KEY
```

**С Gateway:**

```python
api_key=$LITELLM_MASTER_KEY
```

Используется ключ, который ожидает LiteLLM / Gateway.

---

#### Идентификация для HiveTrace (обязательно)

Чтобы Gateway мог корректно связать телеметрию с приложением, пользователем и сессией, необходимо передавать заголовки.

**Обязательные:**

```
X-Application-Id: <HIVETRACE_APPLICATION_ID>
X-User-Id: <USER_ID>
или
X-OpenWebUI-User-Id: <USER_ID>

X-Session-Id: <SESSION_ID>
или
X-OpenWebUI-Chat-Id: <SESSION_ID>
```

**Опционально:**

```
X-HiveTrace-Mode: sync | async
X-HiveTrace-Skip-System-Requests: false
```

Для мультиагентных сценариев обычно фиксируется:

```
X-HiveTrace-Skip-System-Requests: false
```

чтобы сохранять system-инструкции агентов для аудита и расследований.

---

### Поведение телеметрии (мультиагенты vs классический чат)

Агент может выполнять несколько LLM-вызовов в рамках одного пользовательского запроса:

* планирование,
* вызовы инструментов,
* continuation после результатов tools,
* финальный ответ.

Без дополнительной настройки это может приводить к дублированию событий в HiveTrace.

Рекомендуется включить на стороне Gateway:

```bash
HIVETRACE_DEDUP_AGENT_TOOL_CALLS=true
HIVETRACE_SKIP_SYSTEM_REQUESTS=false
```

#### Назначение параметров

**HIVETRACE_DEDUP_AGENT_TOOL_CALLS=true**
предотвращает появление новых событий "user input" на continuation-шагах после выполнения инструментов.

**HIVETRACE_SKIP_SYSTEM_REQUESTS=false**
сохраняет system-контекст, который критически важен для анализа поведения агентов и расследований.

---

### Tools (инструменты)

Поведение инструментов не меняется:

* tools выполняются локально в вашем приложении,
* Gateway не вызывает инструменты,
* HiveTrace анализирует только LLM-запросы и ответы.

Gateway выступает исключительно как контролируемый прокси для взаимодействия с моделью.

---

### Минимальный пример

```python
import os
import httpx
from typing import Any

from openai import AsyncOpenAI
from agents import Agent, ModelSettings, RunConfig, Runner, function_tool, set_tracing_disabled
from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel

set_tracing_disabled(True)

@function_tool
def fetch_users_summary(limit: int = 50) -> dict[str, Any]:
    return {"ok": True, "total_count": 123}

http_client = httpx.AsyncClient(timeout=60.0)

openai_client = AsyncOpenAI(
    base_url=os.environ["GATEWAY_URL"].rstrip("/"),
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
        "X-HiveTrace-Skip-System-Requests": "false",
    },
    http_client=http_client,
)

model = OpenAIChatCompletionsModel(
    model="gpt-4.1-mini",
    openai_client=openai_client
)

agent = Agent(
    name="DB assistant",
    instructions="Call fetch_users_summary once, then answer briefly.",
    tools=[fetch_users_summary],
    model=model,
    model_settings=ModelSettings(tool_choice="required"),
)

run_config = RunConfig(tracing_disabled=True)

messages = [{"role": "user", "content": "How many users do we have?"}]
result = await Runner.run(agent, input=messages, max_turns=2, run_config=run_config)

print(result.final_output)
```

---

### Итог

Для интеграции мультиагентов через Gateway необходимо:

1. заменить `base_url` на Gateway
2. использовать `LITELLM_MASTER_KEY` вместо `OPENAI_API_KEY`
3. добавить идентифицирующие заголовки HiveTrace
4. включить env-параметры Gateway для корректной телеметрии

Агентная архитектура, runtime и инструменты при этом остаются без изменений.
