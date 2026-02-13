---
title: "Интеграция с CrewAI"
---

**Демонстрационный репозиторий**

[https://github.com/anntish/multiagents-crew-forge](https://github.com/anntish/multiagents-crew-forge)

## Шаг 1: Установите зависимость

**Что делать:** Добавьте HiveTrace SDK в ваш проект

**Где:** В `requirements.txt` или через pip

```bash
# Через pip (для быстрого теста)
pip install hivetrace[crewai]>=1.3.5

# Или добавьте в requirements.txt (рекомендуется)
echo "hivetrace[crewai]>=1.3.3" >> requirements.txt
pip install -r requirements.txt
```

**Почему:** HiveTrace SDK предоставляет декораторы и клиенты для отправки данных об активности агентов на платформу мониторинга.

---

## Шаг 2: **ДОБАВЬТЕ** уникальные ID для каждого агента

**Пример:** В `src/config.py`

```python
PLANNER_ID = "333e4567-e89b-12d3-a456-426614174001"
WRITER_ID = "444e4567-e89b-12d3-a456-426614174002"
EDITOR_ID = "555e4567-e89b-12d3-a456-426614174003"
```

**Зачем нужны ID:** HiveTrace отслеживает каждого агента отдельно. UUID гарантирует, что агент будет уникально идентифицирован в системе мониторинга.

---

## Шаг 3: Создайте сопоставление агентов

**Что делать:** Свяжите роли агентов с их ID в HiveTrace

**Пример:** В `src/agents.py` (где определяются агенты)

```python
from crewai import Agent
# ДОБАВИТЬ: импорт ID агентов
from src.config import EDITOR_ID, PLANNER_ID, WRITER_ID

# ДОБАВИТЬ: сопоставление для HiveTrace (ОБЯЗАТЕЛЬНО!)
agent_id_mapping = {
    "Content Planner": {  # ← Должно точно совпадать с Agent(role="Content Planner")
        "id": PLANNER_ID,
        "description": "Создает контент-планы"
    },
    "Content Writer": {   # ← Должно точно совпадать с Agent(role="Content Writer")
        "id": WRITER_ID,
        "description": "Пишет качественные статьи"
    },
    "Editor": {           # ← Должно точно совпадать с Agent(role="Editor")
        "id": EDITOR_ID,
        "description": "Редактирует и улучшает статьи"
    },
}

# Существующие агенты (БЕЗ ИЗМЕНЕНИЙ)
planner = Agent(
    role="Content Planner",  # ← Должно совпадать с ключом в agent_id_mapping
    goal="Создать структурированный контент-план по заданной теме",
    backstory="Вы опытный аналитик...",
    verbose=True,
)

writer = Agent(
    role="Content Writer",   # ← Должно совпадать с ключом в agent_id_mapping
    goal="Написать информативную и увлекательную статью",
    backstory="Вы талантливый писатель...",
    verbose=True,
)

editor = Agent(
    role="Editor",           # ← Должно совпадать с ключом в agent_id_mapping
    goal="Улучшить статью",
    backstory="Вы опытный редактор...",
    verbose=True,
)
```

**Важно:** Ключи в `agent_id_mapping` должны **точно** совпадать с `role` агентов, иначе HiveTrace не сможет связать активность с нужным агентом.

---

## Шаг 4: Интеграция с инструментами (если используются)

**Что делать:** Добавьте поддержку HiveTrace в инструменты

**Пример:** В `src/tools.py`

```python
from crewai.tools import BaseTool
from typing import Optional

class WordCountTool(BaseTool):
    name: str = "WordCountTool"
    description: str = "Считает слова, символы и предложения в тексте"
    # ДОБАВИТЬ: поле HiveTrace (ОБЯЗАТЕЛЬНО!)
    agent_id: Optional[str] = None

    def _run(self, text: str) -> str:
        word_count = len(text.split())
        return f"Количество слов: {word_count}"
```

**Пример:** В `src/agents.py`

```python
from src.tools import WordCountTool
from src.config import PLANNER_ID, WRITER_ID, EDITOR_ID

# ДОБАВИТЬ: создать инструменты для каждого агента
planner_tools = [WordCountTool()]
writer_tools = [WordCountTool()]
editor_tools = [WordCountTool()]

# ДОБАВИТЬ: привязать инструменты к агентам
for tool in planner_tools:
    tool.agent_id = PLANNER_ID

for tool in writer_tools:
    tool.agent_id = WRITER_ID

for tool in editor_tools:
    tool.agent_id = EDITOR_ID

# Использование инструментов в агентах
planner = Agent(
    role="Content Planner",
    tools=planner_tools,  # ← Инструменты конкретного агента
    # ... другие параметры
)
```

**Почему:** HiveTrace отслеживает использование инструментов. Поле `agent_id` в классе инструмента и его заполнение позволяют HiveTrace определить, какой агент использовал инструмент.

---

## Шаг 5: Инициализация HiveTrace в FastAPI (если используется)

**Что делать:** Добавьте клиент HiveTrace в жизненный цикл приложения

**Пример:** В `main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
# ДОБАВИТЬ: импорт HiveTrace SDK
from hivetrace import SyncHivetraceSDK
from src.config import HIVETRACE_ACCESS_TOKEN, HIVETRACE_URL

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ДОБАВИТЬ: инициализация клиента HiveTrace
    hivetrace = SyncHivetraceSDK(
        config={
            "HIVETRACE_URL": HIVETRACE_URL,
            "HIVETRACE_ACCESS_TOKEN": HIVETRACE_ACCESS_TOKEN,
        }
    )
    # Сохранить клиента в состоянии приложения
    app.state.hivetrace = hivetrace
    try:
        yield
    finally:
        # ВАЖНО: закрыть соединение при завершении работы
        hivetrace.close()

app = FastAPI(lifespan=lifespan)
```

---

## Шаг 6: Интеграция в бизнес-логику

**Что делать:** Оберните создание Crew в декоратор HiveTrace

**Пример:** В `src/services/topic_service.py`

```python
import uuid
from typing import Optional
from crewai import Crew
# ДОБАВИТЬ: импорты HiveTrace
from hivetrace import SyncHivetraceSDK
from hivetrace import crewai_trace as trace

from src.agents import agent_id_mapping, planner, writer, editor
from src.tasks import plan_task, write_task, edit_task
from src.config import HIVETRACE_APP_ID

def process_topic(
    topic: str,
    hivetrace: SyncHivetraceSDK,  # ← ДОБАВИТЬ параметр
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
):
    # ДОБАВИТЬ: сгенерировать уникальный ID диалога
    agent_conversation_id = str(uuid.uuid4())

    # ДОБАВИТЬ: общие параметры
    common_params = {
        "agent_conversation_id": agent_conversation_id,
        "user_id": user_id,
        "session_id": session_id,
    }

    # ДОБАВИТЬ: логирование запроса пользователя
    hivetrace.input(
        application_id=HIVETRACE_APP_ID,
        message=f"Запрос информации у агентов по теме: {topic}",
        additional_parameters={
            **common_params,
            "agents": agent_id_mapping,  # ← передаем сопоставление агентов
        },
    )

    # ДОБАВИТЬ: декоратор @trace для мониторинга Crew
    @trace(
        hivetrace=hivetrace,
        application_id=HIVETRACE_APP_ID,
        agent_id_mapping=agent_id_mapping,  # ← ОБЯЗАТЕЛЬНО!
    )
    def create_crew():
        return Crew(
            agents=[planner, writer, editor],
            tasks=[plan_task, write_task, edit_task],
            verbose=True,
        )

    # Выполнение с мониторингом
    crew = create_crew()
    result = crew.kickoff(
        inputs={"topic": topic},
        **common_params  # ← передаем общие параметры
    )

    return {
        "result": result.raw,
        "execution_details": {**common_params, "status": "completed"},
    }
```

**Как это работает:**

1. **`agent_conversation_id`** — уникальный ID для группировки всех действий в одном запросе
2. **`hivetrace.input()`** — отправляет запрос пользователя в HiveTrace для анализа
3. **`@trace`**:
   - Перехватывает все действия агентов внутри Crew
   - Отправляет данные о каждом шаге в HiveTrace
   - Связывает действия с конкретными агентами через `agent_id_mapping`

4. **`**common_params`** — передает метаданные в `crew.kickoff()` для связывания событий

**Важно:** Декоратор `@trace` должен применяться к функции, создающей и возвращающей Crew, **а не** к функции, вызывающей `kickoff()`.

---

## Шаг 7: Обновление эндпоинтов FastAPI (если используется)

**Что делать:** Передайте клиент HiveTrace в бизнес-логику

**Пример:** В `src/routers/topic_router.py`

```python
from fastapi import APIRouter, Body, Request
# ДОБАВИТЬ: импорт типа HiveTrace
from hivetrace import SyncHivetraceSDK

from src.services.topic_service import process_topic
from src.config import SESSION_ID, USER_ID

router = APIRouter(prefix="/api")

@router.post("/process-topic")
async def api_process_topic(request: Request, request_body: dict = Body(...)):
    # ДОБАВИТЬ: получить клиента HiveTrace из состояния приложения
    hivetrace: SyncHivetraceSDK = request.app.state.hivetrace

    return process_topic(
        topic=request_body["topic"],
        hivetrace=hivetrace,  # ← передаем клиента
        user_id=USER_ID,
        session_id=SESSION_ID,
    )
```

**Почему:** Эндпоинт API должен передавать клиент HiveTrace в бизнес-логику, чтобы можно было отправлять данные мониторинга.

---

## 🚨 Частые ошибки

1. **Несовпадение ролей** — ключи в `agent_id_mapping` должны точно совпадать с `role` агентов
2. **Отсутствует `agent_id_mapping`** — декоратор `@trace` обязательно должен получать сопоставление
3. **Декоратор на неверной функции** — `@trace` применяется к функции создания Crew, а не к вызову `kickoff`
4. **Клиент не закрыт** — вызывайте `hivetrace.close()` в жизненном цикле приложения
5. **Неверные учетные данные** — проверьте переменные окружения HiveTrace
