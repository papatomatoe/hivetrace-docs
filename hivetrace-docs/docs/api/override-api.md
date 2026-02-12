---
title: "Override API"
sidebar_position: 4
---

## Override API

### Override-эндпоинты

#### `POST /process_request/override/`

Для валидации **входящих сообщений пользователя** до их передачи в LLM, когда правила проверки необходимо задать прямо в запросе, а не через настройки Web UI.

---

#### `POST /process_response/override/`

Для валидации **исходящих ответов LLM** перед их возвратом конечному пользователю, с конфигурацией проверки непосредственно в запросе.

Override-эндпоинты позволяют задавать параметры валидации inline, игнорируя настройки Web UI.

**Важно:**

* Настройки валидации из Web UI **не применяются**
* Валидация полностью управляется через `validation_config`
* Соответствующие сервисы (**dataclean, guardrails, custom**) должны быть включены на уровне развертывания

---

### Тело запроса

#### Обязательные поля

| Поле                | Тип             | Описание                                                         |
| ------------------- | --------------- | ---------------------------------------------------------------- |
| `application_id`    | `string` (UUID) | Идентификатор приложения. Должен существовать в HiveTrace.       |
| `message`           | `string`        | Сообщение пользователя или ответ LLM в зависимости от эндпоинта. |
| `validation_config` | `object`        | Inline-конфигурация валидации.                                   |

---

#### Опциональные поля

| Поле                    | Тип      | Описание                                           |
| ----------------------- | -------- | -------------------------------------------------- |
| `additional_parameters` | `object` | Метаданные для отслеживания сессии и пользователя. |

---

### Inline-валидация (`validation_config`)

Определяет правила проверки непосредственно внутри запроса.

#### Пример

```json
{
  "application_id": "{{application_id}}",
  "message": "My name is John, my CVC is 222, and I own a car.",
  "additional_parameters": {
    "session_id": "{{client_session_id}}",
    "user_id": "{{client_user_id}}"
  },
  "validation_config": {
    "source": "inline",
    "inline": {
      "guardrails": { "enabled": true },
      "custom": {
        "enabled": true,
        "policies": [
          { 
            "name": "medicine", 
            "prompt": "Do not provide medical advice or discuss medical topics." 
          }
        ]
      },
      "dataclean": {
        "enabled": true,
        "clean_type": "masking",
        "patterns": [
          "CVC",
          { "name": "AUTOMOBILE", "regex": "\\bcar\\b" }
        ]
      }
    }
  }
}
```

---

### Схема ответа

Override-эндпоинты возвращают ту же структуру ответа, что и Base API.
