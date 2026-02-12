---
sidebar_position: 1
title: "Подключение приложений с одной LLM (без агентов)"
sidebar_label: "Одна LLM"
---

## Одна LLM

Эта интеграция подходит для **обычного LLM‑приложения без мультиагентных фреймворков**: вы отправляете пользовательский текст в модель и получаете ответ.

HiveTrace подключается перед моделью и решает две задачи:

- **Контроль входа (`input`)**: что пользователь отправляет в LLM
- **Контроль выхода (`output`)**: что LLM возвращает пользователю

:::info
Если вы используете агентные фреймворки (LangChain/CrewAI/OpenAI Agents), смотрите отдельные страницы интеграций в разделе SDK.
:::

---

## Предварительные требования

Вам понадобятся:

1. **URL инстанса** HiveTrace
2. **API‑токен** (создаётся в UI)
3. **`application_id`** вашего приложения (UUID из UI)

---

## Установка

```bash
pip install hivetrace[base]
```

---

## Конфигурация

SDK читает конфигурацию из переменных окружения:

- `HIVETRACE_URL` — базовый URL инстанса (только `http://` или `https://`)
- `HIVETRACE_ACCESS_TOKEN` — API‑токен
- `HIVETRACE_APP_ID` — опционально (удобный alias для вашего `application_id`)

Пример `.env`:

```bash
HIVETRACE_URL=https://your-hivetrace-instance.com
HIVETRACE_ACCESS_TOKEN=your-access-token
HIVETRACE_APP_ID=your-application-id
```

Альтернатива — передать конфиг явно:

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

## Быстрая интеграция (рекомендованный поток)

Надёжный паттерн для enterprise‑приложений:

1. **Inspect input**: `client.input(...)`
2. **Decide**: можно ли вызывать LLM (и какой текст отправлять — raw или cleaned)
3. **Call LLM**: ваш провайдер (OpenAI/локальная модель/и т.д.)
4. **Inspect output**: `client.output(...)`
5. **Decide**: что вернуть пользователю (ответ LLM или безопасный подготовленный ответ)

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
    # Do not call your LLM
    safe_reply = "Извините, я не могу помочь с этим запросом."
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
    safe_reply = "Извините, я не могу предоставить такой ответ."
    client.output(application_id=APP_ID, message=safe_reply)
    raise SystemExit(safe_reply)
```

:::tip
Если вам нужно **только решение “разрешить/запретить”** без сохранения текста на стороне HiveTrace, используйте `additional_parameters={"censor_only": true}`.
:::

---

## Клиенты: Sync и Async

- `SyncHivetraceSDK` — для синхронных сервисов (Flask/Django, background jobs)
- `AsyncHivetraceSDK` — для async runtimes (FastAPI/async workers)

Оба клиента поддерживают контекстный менеджер для корректного закрытия соединений.

### Управление ресурсами (Sync)

```python
from hivetrace import SyncHivetraceSDK

APP_ID = "your-application-id"

with SyncHivetraceSDK() as client:
    client.input(application_id=APP_ID, message="Hello")
```

### Управление ресурсами (Async)

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

## Метаданные (`additional_parameters`)

Для non‑agent приложения обычно достаточно:

- `session_id` — связывает input/output в диалог
- `user_id` — аналитика/трассировка по пользователям
- `environment` — prod/staging/dev
- `llm_provider`, `llm_model` — полезно для расследований и A/B

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

## Файлы (`files`) — только для `input`

Прикрепления нужны, когда пользователь отправляет документы/контекст, который важен для анализа. Формат — список кортежей:

`(filename: str, content: bytes, mime_type: str)`

```python
from pathlib import Path

files = [
    ("doc1.txt", Path("doc1.txt").read_bytes(), "text/plain"),
]

client.input(
    application_id=APP_ID,
    message="Проанализируй вложение",
    files=files,
)
```

:::note
На текущий момент **файлы поддерживаются для `input()`**. Для `output()` отправляйте только текст ответа модели.
:::

---

## API: `input()` и `output()`

### `input()`

Отправляет **пользовательский запрос** в HiveTrace.

- `application_id` — UUID приложения из UI
- `message` — текст запроса
- `additional_parameters` — опциональные метаданные
- `files` — опциональные файлы (только `input`)

### `output()`

Отправляет **ответ модели** в HiveTrace.

- `application_id` — UUID приложения из UI
- `message` — текст ответа LLM
- `additional_parameters` — опциональные метаданные

:::info
Как правило, в `output()` отправляют **тот текст, который реально показывается пользователю** (после всех пост‑обработок/фильтров).
:::

---
