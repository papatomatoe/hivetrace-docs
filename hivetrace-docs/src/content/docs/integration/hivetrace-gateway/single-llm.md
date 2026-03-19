---
title: "Одна LLM"
sidebar:
  order: 2
---

## Назначение

Режим предназначен для классических LLM-приложений, где:

- приложение отправляет `messages`,
- модель генерирует ответ,
- не используется агентная orchestration-логика,
- отсутствуют tool calls.

Gateway работает как прозрачный прокси с мониторингом.

---

## Когда использовать

Рекомендуется, если:

- требуется централизованный контроль input/output,
- применяются политики безопасности,
- необходим аудит,
- реализован стандартный чат.

---

## Предварительные требования

Необходимые параметры:

- **GATEWAY_URL** — base URL уровня `/v1`
- **LITELLM_MASTER_KEY** — ключ Gateway
- **HIVETRACE_APPLICATION_ID** — UUID приложения
- **USER_ID** — идентификатор пользователя
- **SESSION_ID** — идентификатор сессии

Важно: указывать `/v1`, а не полный endpoint.

---

## Обязательные заголовки

- `Authorization: Bearer <LITELLM_MASTER_KEY>`
- `X-Application-Id`
- `X-User-Id` или `X-OpenWebUI-User-Id`
- `X-Session-Id` или `X-OpenWebUI-Chat-Id`

---

## Пример (Python)

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["GATEWAY_URL"].rstrip("/"),
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
    },
)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "Кратко объясни HiveTrace."}],
)

print(response.choices[0].message.content)
```

---

## Пример (curl)

```bash
curl -X POST "$GATEWAY_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "X-Application-Id: $HIVETRACE_APPLICATION_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "X-Session-Id: $SESSION_ID" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [{"role":"user","content":"Hello from my app"}]
  }'
```

---

## Работа с файлами

Если к сообщению необходимо прикрепить файл, то требуется указать следующий заголовок:

- `-H "X-Attached-Files: <JSON-FILE>"`

JSON должен включать в себя поля:

- "name"
- "content_base64"
- "type"

А так же добавить в тело запроса параметр `request_id` (**uuid v4**) для однозначного определения принадлежности файла к конкретному сообщению.

### Пример (python)

```python
import base64
import uuid
import json
import os
from openai import OpenAI

file_path = "image.png"
with open(file_path, "rb") as f:
    content_b64 = base64.standard_b64encode(f.read()).decode("ascii")

request_id = str(uuid.uuid4())

attached = [
    {
        "name": os.path.basename(file_path),
        "content_base64": content_b64,
        "type": "image/png",
    }
]
attached_json = json.dumps(attached)

client = OpenAI(
    base_url=os.environ["GATEWAY_URL"].rstrip("/"),
    api_key=os.environ["LITELLM_MASTER_KEY"],
    default_headers={
        "X-Application-Id": os.environ["HIVETRACE_APPLICATION_ID"],
        "X-User-Id": os.environ["USER_ID"],
        "X-Session-Id": os.environ["SESSION_ID"],
        "X-Attached-Files": attached_json,
    },
)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "Проанализируй картинку"}],
    metadata={"request_id": request_id}
)

print(response.choices[0].message.content)
```

### Пример (curl)

```bash
REQ_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"

export ATTACHED_JSON=$(jq -c -n \
  --arg name "image.png" \
  --arg b64 "$(base64 -w0 ./image.png)" \
  --arg type "image/png" \
  '[{name: $name, content_base64: $b64, type: $type}]')

curl -X POST "$GATEWAY_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "X-Application-Id: $HIVETRACE_APPLICATION_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "X-Session-Id: $SESSION_ID" \
  -H "X-Attached-Files: $ATTACHED_JSON" \
  -d "{
    \"model\": \"gpt-4.1-mini\",
    \"metadata\": {\"request_id\": \"$REQ_ID\"},
    \"messages\": [{\"role\":\"user\",\"content\":\"Проанализируй картинку\"}]
  }"
```

---

## Результат

Поведение для приложения идентично OpenAI API, с добавленным мониторингом и применением политик.
