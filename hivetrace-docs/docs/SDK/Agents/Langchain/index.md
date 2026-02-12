# Интеграция с LangChain

**Демонстрационный репозиторий**

[https://github.com/anntish/multiagents-langchain-forge](https://github.com/anntish/multiagents-langchain-forge)

В этом проекте реализован мониторинг многоагентной системы в LangChain с помощью HiveTrace SDK.

### Шаг 1. Установка зависимостей

```bash
pip install hivetrace[langchain]>=1.3.5
# опционально: добавить в requirements.txt и установить
echo "hivetrace[langchain]>=1.3.3" >> requirements.txt
pip install -r requirements.txt
```

Что предоставляет пакет: клиенты SDK (синхронные/асинхронные), универсальный коллбек для агентов LangChain и готовые вызовы для отправки входных данных/логов/результатов в HiveTrace.

### Шаг 2. Настройка переменных окружения

* `HIVETRACE_URL`: адрес HiveTrace
* `HIVETRACE_ACCESS_TOKEN`: токен доступа HiveTrace
* `HIVETRACE_APP_ID`: ID вашего приложения в HiveTrace
* `OPENAI_API_KEY`: ключ для LLM-провайдера (пример с OpenAI)
* Дополнительно: `OPENAI_MODEL`, `USER_ID`, `SESSION_ID`

### Шаг 3. Задание фиксированных UUID для агентов

Создайте словарь фиксированных UUID для всех «узлов агентов» (например, оркестратор, специализированные агенты). Это обеспечит однозначную идентификацию при трассировке.

Пример: файл `src/core/constants.py`:

```python
PREDEFINED_AGENT_IDS = {
    "MainHub": "111e1111-e89b-12d3-a456-426614174099",
    "text_agent": "222e2222-e89b-12d3-a456-426614174099",
    "math_agent": "333e3333-e89b-12d3-a456-426614174099",
    "pre_text_agent": "444e4444-e89b-12d3-a456-426614174099",
    "pre_math_agent": "555e5555-e89b-12d3-a456-426614174099",
}
```

Совет: ключи словаря должны совпадать с реальными именами узлов в логах (`tool`/имя агента в вызовах LangChain).

### Шаг 4. Подключение коллбека к исполнителям и инструментам

Создайте и используйте `AgentLoggingCallback` — его нужно передать:

* как коллбек в `AgentExecutor` (оркестратор), и
* как `callback_handler` в ваших инструментах/обёртках агентов (`BaseTool`).

Пример: файл `src/core/orchestrator.py` (фрагмент):

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
        # Пример: обёртки агентов как инструменты
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

Важно: все вложенные агенты/инструменты, которые создают свой `AgentExecutor` или наследуются от `BaseTool`, также должны получать этот `callback_handler`, чтобы их шаги попадали в трассировку.

### Шаг 5. Однострочная интеграция в бизнес-метод

Используйте хелпер `run_with_tracing` из `hivetrace/adapters/langchain/api.py`. Он:

* логирует входные данные с привязкой агентов и метаданных;
* вызывает ваш оркестратор;
* собирает и отправляет накопленные логи/финальный ответ.

Минимальный пример (скрипт):

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

Вариант для FastAPI (фрагмент хендлера):

```python
from fastapi import APIRouter, Request
from hivetrace.adapters.langchain import run_with_tracing
import uuid

router = APIRouter()

@router.post("/query")
async def process_query(payload: dict, request: Request):
    orchestrator = request.app.state.orchestrator
    conv_id = str(uuid.uuid4()) # для каждого запроса создаём новый agent_conversation_id
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

### Шаг 6. Повторное использование клиента HiveTrace (опционально)

Хелперы автоматически создают клиент с коротким временем жизни, если он не передан. Если хотите переиспользовать клиент — создайте его один раз за жизненный цикл приложения и передавайте в хелперы.

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

Затем:

```python
result = run_with_tracing(
    orchestrator=orchestrator,
    query=payload.query,
    hivetrace=request.app.state.hivetrace,  # передаём свой клиент
    application_id=request.app.state.HIVETRACE_APP_ID,
)
```

### Как выглядят логи в HiveTrace

* **Узлы агентов**: узлы оркестратора и специализированные «обёртки агентов» (`text_agent`, `math_agent` и т.д.).
* **Реальные инструменты**: низкоуровневые инструменты (например, `text_analyzer`, `text_formatter`) логируются на событиях начала/окончания.
* **Служебные записи**: автоматически добавляются шаги `return_result` (возврат результата родителю) и `final_answer` (финальный ответ корневого узла).

Это даёт наглядный граф вызовов с направлением потока данных и финальным ответом.

### Частые ошибки и как их избежать

* **Несовпадение имени**: ключ в `PREDEFINED_AGENT_IDS` должен совпадать с именем узла/инструмента в логах.
* **Нет привязки агентов**: либо передайте `agents_mapping` в `run_with_tracing`, либо задайте `predefined_agent_ids` в `AgentLoggingCallback` — SDK построит привязку автоматически.
* **Коллбек не подключён**: добавьте `AgentLoggingCallback` во все `AgentExecutor` и `BaseTool` через параметр `callback_handler`.
* **Клиент не закрыт**: используйте lifespan/контекстный менеджер для `SyncHivetraceSDK`.
