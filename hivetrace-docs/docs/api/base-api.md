---
title: "Base API"
sidebar_position: 3
---

## Base API

### Базовые эндпоинты

#### `POST /process_request/`

Используется для анализа **сообщений пользователя до их передачи в LLM** с применением правил валидации, настроенных в Web UI.

При включенных модулях HiveTrace выполняет:

* обнаружение и маскирование чувствительных данных (dataclean)
* проверку встроенных политик (guardrails)
* проверку пользовательских политик
* расчет потребления токенов
* связывание сессии и пользователя
* сохранение результатов мониторинга

---

#### `POST /process_response/`

Используется для анализа **ответов LLM перед их возвратом конечному пользователю** с применением настроек валидации из Web UI.

При включенных модулях HiveTrace выполняет:

* обнаружение и маскирование чувствительных данных (dataclean)
* проверку встроенных политик (guardrails)
* расчет потребления токенов
* связывание сессии и пользователя
* сохранение результатов мониторинга

> **Примечание:** Пользовательские политики применяются **только** к `/process_request/`.

---

### Тело запроса

#### Обязательные поля

| Поле             | Тип             | Описание                                                         |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| `application_id` | `string` (UUID) | Идентификатор приложения. Должен существовать в HiveTrace.       |
| `message`        | `string`        | Сообщение пользователя или ответ LLM в зависимости от эндпоинта. |

---

#### Опциональные поля

| Поле                    | Тип      | Описание                                           |
| ----------------------- | -------- | -------------------------------------------------- |
| `additional_parameters` | `object` | Метаданные для отслеживания сессии и пользователя. |

---

### Структура additional_parameters

| Поле         | Тип      | Описание                            |
| ------------ | -------- | ----------------------------------- |
| `user_id`    | `string` | Внешний идентификатор пользователя. |
| `session_id` | `string` | Внешний идентификатор сессии.       |

---

### Схема ответа

Оба эндпоинта возвращают JSON-объект.

| Поле                     | Тип              | Описание                                                          |
| ------------------------ | ---------------- | ----------------------------------------------------------------- |
| `request_id`             | `string`         | UUID записи анализа.                                              |
| `schema_version`         | `string`         | Версия схемы ответа.                                              |
| `status`                 | `string`         | `success \| partial_success \| error`                             |
| `errors`                 | `string[]`       | Список ошибок обработки (может быть пустым).                      |
| `tokens.count`           | `integer`        | Количество обработанных токенов.                                  |
| `tokens.usage_severity`  | `string \| null` | `low \| high \| critical`                                         |
| `guardrails.flagged`     | `boolean`        | Флаг нарушения встроенных политик.                                |
| `custom_policy.flagged`  | `boolean`        | Флаг нарушения пользовательских политик.                          |
| `dataclean.flagged`      | `boolean`        | Показывает, что были обнаружены чувствительные данные.            |
| `dataclean.cleaned_text` | `string \| null` | Санитизированная версия сообщения после маскирования или очистки. |
| `dataclean.types[]`      | `array`          | Типы обнаруженных сущностей и их количество.                      |

#### Структура dataclean.types

```json
{
  "type": "NAME",
  "count": 1
}
```

---

### Примеры запросов

#### Process Request

```bash
curl -sS -X POST "$BASE_URL/process_request/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id":"<uuid>",
    "message":"My name is John and my CVC is 222.",
    "additional_parameters":{
      "user_id":"user-123",
      "session_id":"session-456"
    }
  }'
```

---

#### Process Response

```bash
curl -sS -X POST "$BASE_URL/process_response/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id":"<uuid>",
    "message":"Hello John, I have processed your request.",
    "additional_parameters":{
      "user_id":"user-123",
      "session_id":"session-456"
    }
  }'
```

---

### Пример ответа

```json
{
  "request_id": "62c51dcf-f7bb-44d3-8c3a-6007b2a44d7d",
  "schema_version": "2.0.0",
  "status": "success",
  "errors": [],
  "tokens": {
    "count": 8,
    "usage_severity": null
  },
  "guardrails": {
    "flagged": false
  },
  "custom_policy": {
    "flagged": false
  },
  "dataclean": {
    "flagged": true,
    "cleaned_text": "My name is XXXX",
    "types": [
      {
        "type": "NAME",
        "count": 1
      }
    ]
  }
}
```
