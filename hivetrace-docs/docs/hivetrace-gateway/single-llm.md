---
title: "Одна LLM"
sidebar_position: 2
---

## Одна LLM

### Назначение

Режим предназначен для классических LLM-приложений, где:

* приложение отправляет `messages`,
* модель генерирует ответ,
* не используется агентная orchestration-логика,
* отсутствуют tool calls.

Gateway работает как прозрачный прокси с мониторингом.

---

### Когда использовать

Рекомендуется, если:

* требуется централизованный контроль input/output,
* применяются политики безопасности,
* необходим аудит,
* реализован стандартный чат.

---

### Предварительные требования

Необходимые параметры:

* **GATEWAY_URL** — base URL уровня `/v1`
* **LITELLM_MASTER_KEY** — ключ Gateway
* **HIVETRACE_APPLICATION_ID** — UUID приложения
* **USER_ID** — идентификатор пользователя
* **SESSION_ID** — идентификатор сессии

Важно: указывать `/v1`, а не полный endpoint.

---

### Обязательные заголовки

* `Authorization: Bearer <LITELLM_MASTER_KEY>`
* `X-Application-Id`
* `X-User-Id` или `X-OpenWebUI-User-Id`
* `X-Session-Id` или `X-OpenWebUI-Chat-Id`

---

### Пример (Python)

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

### Пример (curl)

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

### Результат

Поведение для приложения идентично OpenAI API, с добавленным мониторингом и применением политик.


