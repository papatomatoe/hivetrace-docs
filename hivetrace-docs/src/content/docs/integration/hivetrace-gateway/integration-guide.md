---
title: "Руководство по интеграции"
sidebar:
  order: 1
---

**Версия документа:** для gateway 4.1.0

**Аудитория:** инженерные и платформенные команды, интегрирующие HiveTrace Gateway в производственную среду.

Документ описывает контракт между клиентским приложением и gateway: формат запросов и ответов, модель обработки ошибок, особенности потоковой передачи. Руководство предназначено для практического внедрения и эксплуатации интеграции.

---

## 1. Назначение и место в архитектуре

HiveTrace Gateway представляет собой OpenAI-совместимый HTTP-прокси, который размещается между клиентским приложением и LLM-провайдером (OpenAI, Anthropic OpenAI-compat, LiteLLM, vLLM, Ollama в OpenAI-режиме и др.). Для каждого запроса выполняется следующая последовательность:

1. Принимается gateway как обычный OpenAI-вызов.
2. Регистрируется в HiveTrace до отправки в LLM.
3. Проксируется в апстрим.
4. Регистрируется в HiveTrace после получения ответа.

При соответствующей политике HiveTrace может **отклонить** запрос или **заменить** ответ модели на заранее определенное сообщение. Это возможно только при синхронном режиме доставки данных на анализ в мониторинг hivetrace.

```
┌────────────┐     ┌──────────────────┐     ┌────────────┐
│   Client   │────▶│  HiveTrace       │────▶│  Upstream  │
│            │     │  Gateway :4100   │     │ (LiteLLM,  │
│            │◀────│                  │◀────│  vLLM, …)  │
└────────────┘     └────────┬─────────┘     └────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  HiveTrace   │
                    │  Monitoring  │
                    └──────────────┘
```

### 1.1. Совместимость с OpenAI

API соответствует OpenAI Chat Completions, Embeddings и Models: формат тела запроса, форма ответа, SSE-стриминг и envelope ошибок идентичны OpenAI. Тело запроса при форвардинге в апстрим не модифицируется (исключение: `stream: true` принудительно переписывается в `false` при `app_mode=sync`, см. раздел 6.3.2).

Дополнительные значения (application_id, user_id, session_id), необходмые для аналитики мониторинга, в gateway передаются через HTTP-заголовки. В апстрим они не пробрасываются и на ответ модели не влияют. Полный список — раздел 4.

Заголовок `X-HiveTrace-Api-Key` обязателен для всех запросов к gateway. В OpenAI SDK задается через `default_headers` — пример в разделе 5.1.

### 1.2. OpenAPI спецификация

Контракт API доступен в формате OpenAPI 3.1:

- Снапшот: [`openapi.json`](./openapi.json).
- На запущенном экземпляре gateway: `GET /openapi.json`, Swagger UI на `/docs`, ReDoc на `/redoc`.

---

## 2. Эндпоинты

Gateway предоставляет единую точку входа (по умолчанию `:4100`) и реализует три OpenAI-совместимых эндпоинта:

| Метод  | Путь                   | Назначение                                                                          | Пайплайн HiveTrace                                     |
| ------ | ---------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `POST` | `/v1/chat/completions` | Chat completion. Для асинхронного режима мониторинга поддерживается `stream: true`. | **Полный** (pre-call + post-call + логирование ошибок) |
| `POST` | `/v1/embeddings`       | Embeddings.                                                                         | **Не применяется** — прозрачное проксирование          |
| `GET`  | `/v1/models`           | Список моделей апстрима.                                                            | **Не применяется** — прозрачное проксирование          |

Для `chat/completions` доступен полный контур проверок политиками HiveTrace.

---

## 3. Аутентификация

Gateway использует **двухуровневую** модель авторизации:

### 3.1. Клиент → Gateway

Клиент передает заголовок `X-HiveTrace-Api-Key: <gateway-key>` — **обязательный** ключ доступа к gateway. Без него любой запрос ко всем эндпоинтам (`/v1/chat/completions`, `/v1/embeddings`, `/v1/models`) отклоняется со статусом `401 invalid_request_error`. Этим же ключом gateway аутентифицируется в HiveTrace при исходящих вызовах, поэтому переключение клиентского ключа автоматически переключает идентичность gateway в HiveTrace — **серверный токен в env не используется и был удалён**.

### 3.2. Клиент → Gateway → Апстрим

Клиент передает заголовок `Authorization: Bearer <key>`. **Gateway не валидирует и не сохраняет этот токен**; он передается в апстрим без изменений. Это означает следующее:

- `<key>` должен быть действительным ключом **апстрима** (например, OpenAI API key для прямого обращения к OpenAI или ключ LiteLLM).

### 3.3. Приложения

Идентификация приложения выполняется по заголовку `X-Application-Id` (см. п4). Это позволяет одному экземпляру gateway обслуживать несколько приложений с **различными политиками** HiveTrace без изменения инфраструктурной конфигурации.

---

## 4. Заголовки запроса

Колонка «Источник» обозначает, относится ли заголовок к стандарту OpenAI (проксируется в апстрим без интерпретации gateway) или является расширением gateway (обрабатывается gateway, в апстрим не пробрасывается).

| Заголовок                        | Источник | Обязательность          | Назначение                                                                                                                             |
| -------------------------------- | -------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Authorization: Bearer <key>`    | OpenAI   | для апстрима            | Ключ апстрима. Передаётся в апстрим без изменений и валидации.                                                                         |
| `Content-Type: application/json` | OpenAI   | для non-stream запросов | Стандартный для OpenAI API.                                                                                                            |
| `Accept: text/event-stream`      | OpenAI   | для stream-запросов     | Стандартный для OpenAI streaming.                                                                                                      |
| `X-HiveTrace-Api-Key`            | Gateway  | **да**                  | Ключ доступа к gateway. Также используется как Bearer в исходящих вызовах gateway → HiveTrace. Отсутствие или пустое значение → `401`. |
| `X-Application-Id`               | Gateway  | нет                     | UUID приложения в HiveTrace. Определяет per-app политику. При отсутствии — fallback на ENV `HIVETRACE_APPLICATION_ID`.                 |
| `X-User-Id`                      | Gateway  | нет                     | Идентификатор конечного пользователя для аудита.                                                                                       |
| `X-Session-Id`                   | Gateway  | нет                     | Идентификатор пользовательской сессии.                                                                                                 |
| `X-Attached-Files`               | Gateway  | нет                     | JSON-массив дескрипторов вложений для отдельной аудит-копии в HiveTrace. Формат — раздел 5.3.2.                                        |

---

## 5. Формат запроса

Тело запроса соответствует payload OpenAI Chat Completions / Embeddings. Специфичных для gateway полей в теле нет.

### 5.1. HTTP-примеры

Минимальный запрос:

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: 11111111-2222-3333-4444-555555555555" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "Привет!"}]
  }'
```

С идентификацией пользователя и сессии:

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: 11111111-…" \
  -H "X-User-Id: alice@company.com" \
  -H "X-Session-Id: session-2025-04-28-abc" \
  -d '{ "model": "gpt-5", "messages": [...] }'
```

Streaming:

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{ "model": "gpt-5", "stream": true, "messages": [...] }'
```

### 5.3. Передача файлов

Передача файлов поддерживается двумя стратегиями. Они решают разные задачи и могут использоваться по отдельности или одновременно.

| Стратегия                            | Файл попадает в LLM | Файл попадает в HiveTrace (audit) | Изменения в OpenAI-клиенте    |
| ------------------------------------ | ------------------- | --------------------------------- | ----------------------------- |
| 5.3.1. Стандарт OpenAI (multimodal)  | Да                  | Нет                               | Не требуются                  |
| 5.3.2. Заголовок `X-Attached-Files`  | Нет                 | Да                                | Один дополнительный заголовок |
| 5.3.3. Обе стратегии в одном запросе | Да                  | Да                                | Один дополнительный заголовок |

#### 5.3.1. Стратегия 1 — стандарт OpenAI (multimodal `messages[].content`)

Файлы передаются стандартным OpenAI-способом — массивом частей в `messages[].content`. Gateway не интерпретирует эти части и форвардит тело запроса в апстрим без изменений.

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -d '{
    "model": "gpt-5",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "Что на изображении?"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KG..."}}
      ]
    }]
  }'
```

Поведение:

- **LLM.** Получает запрос в стандартном OpenAI multimodal формате. Обработка `image_url`, `file` и прочих нетекстовых частей зависит от модели и апстрима.
- **HiveTrace.** В запись `user_prompt` записывается только текстовая часть (`type: "text"`). Содержимое `image_url`, `file` и прочих нетекстовых частей в HiveTrace не сохраняется.
- **Изменения в клиенте.** Не требуются. Любой OpenAI-клиент или SDK с поддержкой multimodal работает без изменений.

Применимо, когда требуется обработка файла моделью без сохранения аудит-копии файла в HiveTrace.

#### 5.3.2. Стратегия 2 — расширение `X-Attached-Files`

Файлы передаются в заголовке `X-Attached-Files` как JSON-массив дескрипторов. Gateway не пробрасывает заголовок в апстрим; вместо этого он скачивает / декодирует файлы и прикрепляет их к аудит-записи `user_prompt` в HiveTrace.

Передача через base64 (для локальных файлов):

```bash
B64=$(base64 -i ./test111.txt | tr -d '\n')
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -H "X-User-Id: alice@company.com" \
  -H "X-Attached-Files: [{\"name\":\"test111.txt\",\"content_base64\":\"$B64\",\"type\":\"text/plain\"}]" \
  -d '{ "model": "gpt-5", "messages": [{"role":"user","content":"Сообщение пользователя"}] }'
```

Передача через URL (gateway скачивает файл по HTTP/HTTPS):

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -H "X-User-Id: alice@company.com" \
  -H 'X-Attached-Files: [{"url":"https://files.company.example/contract.pdf","name":"contract.pdf","type":"application/pdf"}]' \
  -d '{ "model": "gpt-5", "messages": [{"role":"user","content":"Сообщение пользователя"}] }'
```

Формат дескриптора (`X-Attached-Files` — JSON-массив, элементы содержат либо `url`, либо `content_base64`):

| Поле             | Тип    | Описание                                                                                            |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------- |
| `url`            | string | HTTP/HTTPS URL файла. Поддерживается также `data:` URI с inline base64.                             |
| `content_base64` | string | Base64-кодированное содержимое файла. Альтернатива `url`.                                           |
| `name`           | string | Имя файла. Используется при сохранении в HiveTrace; при отсутствии выводится из URL.                |
| `type`           | string | MIME-тип файла. При отсутствии определяется по расширению или `Content-Type` ответа при скачивании. |

Алиас заголовка: `X-AttachedFiles`.

Поведение:

- **LLM.** Тело запроса в апстрим уходит без изменений; `X-Attached-Files` в апстрим не пробрасывается. Если в `messages[].content` нет inline-данных файла — модель его не получает.
- **HiveTrace.** В запись `user_prompt` дополнительно прикрепляется аудит-копия файла, привязанная к `analysis_id` запроса.
- **Изменения в клиенте.** Один дополнительный заголовок. Тело запроса остаётся стандартным OpenAI-payload.

Дополнительные возможности по сравнению со стратегией 1:

- Аудит-копия файла сохраняется в HiveTrace независимо от того, передаётся ли файл модели.
- Поддерживается передача по URL — gateway сам скачивает файл; клиенту не нужно загружать содержимое в payload запроса.
- Содержимое файла попадает в HiveTrace целиком, а не только текстовая часть запроса.

#### 5.3.3. Комбинированный сценарий

Если требуется одновременно (а) подать файл в LLM и (б) сохранить его аудит-копию в HiveTrace, обе стратегии применяются в одном запросе. `messages[].content` обеспечивает доставку в модель, `X-Attached-Files` — аудит-копию в HiveTrace.

```bash
B64=$(base64 -i ./contract.pdf | tr -d '\n')
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -H "X-User-Id: alice@company.com" \
  -H "X-Attached-Files: [{\"name\":\"contract.pdf\",\"content_base64\":\"$B64\",\"type\":\"application/pdf\"}]" \
  -d "{
    \"model\": \"gpt-5\",
    \"messages\": [{
      \"role\": \"user\",
      \"content\": [
        {\"type\": \"text\", \"text\": \"Сделай выжимку документа.\"},
        {\"type\": \"file\", \"file\": {\"filename\": \"contract.pdf\", \"file_data\": \"data:application/pdf;base64,$B64\"}}
      ]
    }]
  }"
```

В этом случае:

1. `messages[].content` пропускается в апстрим без изменений; модель получает файл по стандартному OpenAI-протоколу.
2. `X-Attached-Files` обрабатывается gateway параллельно: файл декодируется и прикрепляется к `user_prompt` в HiveTrace.
3. Ответ модели регистрируется в HiveTrace стандартным post-call вызовом.

Применимо для compliance-сценариев, где требуется и обработка файла моделью, и аудит исходного содержимого в HiveTrace.

#### 5.3.4. Обработка ошибок при работе с вложениями

Сбой скачивания или декодирования файла (HTTP `>=400`, таймаут, размер превышает `HIVETRACE_FILES_MAX_BYTES`, ошибка декодирования base64) не приводит к отказу клиенту. Gateway изолирует такие сбои:

- Проблемный файл не попадает в HiveTrace. В логи gateway пишется предупреждение с диагностикой (`Attachment download failed: url=… status=404` и т. п.).
- Остальные файлы в `X-Attached-Files` обрабатываются независимо.
- Тело запроса передаётся в апстрим без изменений.
- Клиент получает обычный ответ модели с HTTP-статусом, соответствующим ответу апстрима.

### Лимиты на вложения

| Параметр                         | Дефолт | ENV                               |
| -------------------------------- | ------ | --------------------------------- |
| Максимальный размер одного файла | 20 MiB | `HIVETRACE_FILES_MAX_BYTES`       |
| Параллельных скачиваний          | 4      | `HIVETRACE_FILES_MAX_CONCURRENCY` |
| Таймаут скачивания одного файла  | 60 с   | `HIVETRACE_FILES_TIMEOUT`         |

Файл, превышающий лимит, исключается из обработки с записью предупреждения в лог; остальные вложения продолжают обрабатываться.

### 5.4. Лимиты на размер тела запроса

Gateway не накладывает собственный лимит на размер тела запроса. Контроль выполняется на стороне апстрима.

---

## 6. Формат ответа

### 6.1. Успешный non-streaming ответ

Тело ответа и HTTP-статус **полностью соответствуют ответу апстрима**. Тип содержимого: `application/json`. Структура соответствует стандартному формату OpenAI:

```json
{
	"id": "chatcmpl-…",
	"object": "chat.completion",
	"created": 1234567890,
	"model": "gpt-5",
	"choices": [
		{
			"index": 0,
			"message": { "role": "assistant", "content": "..." },
			"finish_reason": "stop"
		}
	],
	"usage": { "prompt_tokens": 23, "completion_tokens": 45, "total_tokens": 68 }
}
```

### 6.2. Успешный streaming ответ

`Content-Type: text/event-stream`. Тело ответа представляет собой последовательность SSE-кадров:

```
data: {"id":"…","object":"chat.completion.chunk","choices":[{"delta":{"content":"При"}}]}

data: {"id":"…","object":"chat.completion.chunk","choices":[{"delta":{"content":"вет!"},"finish_reason":"stop"}]}

data: [DONE]

```

Между обычными `data:`-кадрами могут передаваться **comment-кадры** для поддержания соединения:

```
: keepalive

```

> Streaming ответ может формироваться для пользователя при работающем мониторинге только в асинхронном режиме.

### 6.3. Подмена ответа политикой HiveTrace

Возможна **только** при `app_mode=sync` в per-app политике (Redis). Если `mode=async` либо политика не настроена, описанное в этом разделе поведение к запросу не применяется.

#### 6.3.1. Pre-call блок (HiveTrace отверг до вызова LLM)

Запрос **не был передан** в апстрим. Gateway возвращает синтезированный `chat.completion` с диагностическим блоком `metadata.hivetrace`:

```json
{
	"id": "hivetrace-guardrails-<uuid>",
	"object": "chat.completion",
	"created": 1717171717,
	"model": "<запрошенная или 'unknown'>",
	"choices": [
		{
			"index": 0,
			"message": {
				"role": "assistant",
				"content": "<фраза из политики приложения>"
			},
			"finish_reason": "stop"
		}
	],
	"usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 },
	"metadata": {
		"hivetrace": {
			"response_replaced": true,
			"response_replacement": {
				"stage": "pre_call",
				"type": "<guardrails|custom_policy|dataclean>",
				"request_id": "<metadata.request_id из тела запроса или сгенерированный UUID>"
			},
			"prepared_response": { "...": "контекст вердикта от HiveTrace" }
		}
	}
}
```

Клиент может определить факт замены по наличию `metadata.hivetrace.response_replaced == true` либо по префиксу `id` (`hivetrace-…`).

#### 6.3.2. Streaming + sync mode

В режиме `sync` gateway **принудительно отключает** `stream: true` (заменяя его на `stream: false`) еще до обращения к HiveTrace. Причина заключается в том, что подмена SSE-ответа после начала передачи клиенту технически невозможна. Поэтому в `sync`-режиме клиент всегда получает non-streaming ответ, даже если в `body.stream` было указано `true`.

---

## 7. Ошибки

Все ошибки, возвращаемые клиенту, имеют следующую форму:

```json
{"error": {"message": "...", "type": "...", "code": <int>}}
```

Если апстрим уже возвращает ошибку в формате OpenAI (`{"error": {...}}`), gateway передает ее **без дополнительной обертки**, сохраняя исходные поля провайдера (`type`, `param`, `code`).

Поле `type` используется для различения источников ошибок:

- `invalid_request_error` — клиентская ошибка, отклонённая gateway или апстримом.
- `upstream_error` — апстрим вернул `>=400`, а тело ответа не соответствовало OpenAI-совместимому формату.
- `gateway_error` — gateway не смог успешно обратиться к апстриму. Всегда `code: 502`.
- `rate_limit_error`, `authentication_error` и др. — нативные значения от OpenAI-совместимых апстримов, передаваемые без изменения.

### 7.1. Полная таблица

| Статус | Источник                        | Условие                                                                                                                              | Тип в `error.type`                    |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `400`  | gateway                         | Невалидный JSON в теле запроса                                                                                                       | `invalid_request_error`               |
| `400`  | апстрим                         | Бизнес-валидация (отсутствует `messages`, превышен context window, и т.п.)                                                           | `invalid_request_error` (passthrough) |
| `401`  | gateway                         | Отсутствует или пустой заголовок `X-HiveTrace-Api-Key`                                                                               | `invalid_request_error`               |
| `401`  | апстрим                         | `Authorization: Bearer` отвергнут апстримом                                                                                          | `invalid_request_error` (passthrough) |
| `403`  | апстрим                         | Авторизация прошла, но действие запрещено (например, organization without quota)                                                     | passthrough                           |
| `404`  | апстрим                         | Указанная `модель` не существует                                                                                                     | `invalid_request_error` (passthrough) |
| `413`  | апстрим / прокси                | Тело слишком большое                                                                                                                 | `upstream_error`                      |
| `422`  | апстрим                         | Payload не прошел валидацию (strict-mode схемы)                                                                                      | passthrough                           |
| `429`  | апстрим                         | Rate limit                                                                                                                           | `rate_limit_error` (passthrough)      |
| `500`  | апстрим                         | Внутренняя ошибка апстрима                                                                                                           | `upstream_error`                      |
| `502`  | gateway                         | Сетевая ошибка между gateway и апстримом (DNS, refused, TLS). Также — `httpx.ReadTimeout` ДО первого байта на non-streaming запросе. | `gateway_error`                       |
| `503`  | апстрим                         | Апстрим недоступен (maintenance, перегруз)                                                                                           | `upstream_error`                      |
| `504`  | — _(только в SSE error-кадрах)_ | mid-stream `httpx.TimeoutException`                                                                                                  | `upstream_error`                      |

---

## 8. Таймауты и лимиты

### 8.1. Таймауты по слоям

| Слой                                                            | Параметр                           | Дефолт | Кто контролирует |
| --------------------------------------------------------------- | ---------------------------------- | ------ | ---------------- |
| Gateway → апстрим (один HTTP-вызов)                             | `GATEWAY_UPSTREAM_TIMEOUT`         | 120 с  | gateway          |
| Gateway → HiveTrace (`/process_request/`, `/process_response/`) | `HIVETRACE_TIMEOUT`                | 60 с   | gateway          |
| Gateway → URL вложения (скачивание)                             | `HIVETRACE_FILES_TIMEOUT`          | 60 с   | gateway          |
| Gateway → клиент: SSE keepalive                                 | `GATEWAY_STREAM_HEARTBEAT_SECONDS` | 60 с   | gateway          |

---

## 9. Конфигурация

### 9.1. Минимальный набор переменных окружения

```bash
# Апстрим
UPSTREAM_URL=http://litellm:4000

# HiveTrace
HIVETRACE_URL=https://hivetrace.example.com/api
HIVETRACE_APPLICATION_ID=<default app uuid>

# Redis (для per-app политик; опционально, если блокировки не требуются)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_USER=""
REDIS_PASSWORD="admin"
REDIS_SSL=False
```

### 9.2. Поведение при отсутствии HiveTrace

Если `HIVETRACE_URL` не задан, gateway форвардит запросы в апстрим без отправки телеметрии в HiveTrace. При импорте модуля в stderr выводится предупреждение `HiveTrace is effectively disabled`.

Контракт `X-HiveTrace-Api-Key` сохраняется: ключ остается обязательным для клиентских запросов, однако при отсутствии подключения к HiveTrace фактически не используется. Этот режим предназначен для отладки и устойчивой обработки ошибок конфигурации; в развертывании параметр `HIVETRACE_URL` должен быть задан явно.

### 9.3. Поведение при отсутствии Redis

Если Redis не сконфигурирован, per-app политики блокировки недоступны; pre-call и post-call телеметрия в HiveTrace отправляется в режиме `async` по умолчанию.
