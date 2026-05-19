---
title: "Integration Guide"
sidebar:
  order: 1
---

**Document version:** for gateway 4.1.0

**Audience:** engineering and platform teams integrating HiveTrace Gateway into a production environment.

This document describes the contract between the client application and the gateway: request and response formats, the error handling model, and streaming behavior. The guide is intended for practical implementation and operation of the integration.

---

## 1. Purpose and Place in the Architecture

HiveTrace Gateway is an OpenAI-compatible HTTP proxy placed between the client application and the LLM provider (OpenAI, Anthropic OpenAI-compatible endpoints, LiteLLM, vLLM, Ollama in OpenAI mode, and others). For each request, the following sequence is performed:

1. The gateway receives it as a regular OpenAI call.
2. It is registered in HiveTrace before being sent to the LLM.
3. It is proxied to the upstream.
4. It is registered in HiveTrace after the response is received.

With the appropriate policy, HiveTrace can **reject** a request or **replace** the model response with a predefined message. This is only possible in synchronous mode, when data is delivered to HiveTrace monitoring for analysis synchronously.

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

### 1.1. OpenAI Compatibility

The API matches OpenAI Chat Completions, Embeddings, and Models: the request body format, response shape, SSE streaming, and error envelope are identical to OpenAI. The request body is not modified when forwarded to the upstream, with one exception: `stream: true` is forcibly rewritten to `false` when `app_mode=sync`; see section 6.3.2.

Additional values required for monitoring analytics (`application_id`, `user_id`, `session_id`) are passed to the gateway through HTTP headers. They are not forwarded to the upstream and do not affect the model response. See section 4 for the full list.

The `X-HiveTrace-Api-Key` header is required for all requests to the gateway. In the OpenAI SDK, it is set through `default_headers`; see the example in section 5.1.

### 1.2. OpenAPI Specification

The API contract is available in OpenAPI 3.1 format:

- Snapshot: [`openapi.json`](./openapi.json).
- On a running gateway instance: `GET /openapi.json`, Swagger UI at `/docs`, ReDoc at `/redoc`.

---

## 2. Endpoints

The gateway provides a single entry point (`:4100` by default) and implements three OpenAI-compatible endpoints:

| Method | Path                   | Purpose                                                                 | HiveTrace pipeline                              |
| ------ | ---------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| `POST` | `/v1/chat/completions` | Chat completion. `stream: true` is supported for async monitoring mode. | **Full** (pre-call + post-call + error logging) |
| `POST` | `/v1/embeddings`       | Embeddings.                                                             | **Not applied** - transparent proxying          |
| `GET`  | `/v1/models`           | List of upstream models.                                                | **Not applied** - transparent proxying          |

The full HiveTrace policy check path is available for `chat/completions`.

---

## 3. Authentication

The gateway uses a **two-level** authorization model:

### 3.1. Client -> Gateway

The client sends the `X-HiveTrace-Api-Key: <gateway-key>` header, which is the **required** access key for the gateway. Without it, any request to any endpoint (`/v1/chat/completions`, `/v1/embeddings`, `/v1/models`) is rejected with status `401 invalid_request_error`. The gateway uses the same key to authenticate to HiveTrace for outgoing calls, so changing the client key automatically changes the gateway identity in HiveTrace. The **server token in env is not used and has been removed**.

### 3.2. Client -> Gateway -> Upstream

The client sends the `Authorization: Bearer <key>` header. **The gateway does not validate or store this token**; it is passed to the upstream unchanged. This means:

- `<key>` must be a valid **upstream** key, such as an OpenAI API key for direct calls to OpenAI or a LiteLLM key.

### 3.3. Applications

The application is identified by the `X-Application-Id` header; see section 4. This allows one gateway instance to serve multiple applications with **different HiveTrace policies** without changing infrastructure configuration.

---

## 4. Request Headers

The "Source" column indicates whether the header belongs to the OpenAI standard (proxied to the upstream without gateway interpretation) or is a gateway extension (processed by the gateway and not forwarded to the upstream).

| Header                           | Source  | Requiredness            | Purpose                                                                                                                              |
| -------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Authorization: Bearer <key>`    | OpenAI  | for upstream            | Upstream key. Passed to the upstream without modification or validation.                                                             |
| `Content-Type: application/json` | OpenAI  | for non-stream requests | Standard for the OpenAI API.                                                                                                         |
| `Accept: text/event-stream`      | OpenAI  | for stream requests     | Standard for OpenAI streaming.                                                                                                       |
| `X-HiveTrace-Api-Key`            | Gateway | **yes**                 | Gateway access key. Also used as the Bearer token for outgoing gateway -> HiveTrace calls. Missing or empty value -> `401`.          |
| `X-Application-Id`               | Gateway | no                      | Application UUID in HiveTrace. Determines the per-app policy. If missing, falls back to the `HIVETRACE_APPLICATION_ID` env variable. |
| `X-User-Id`                      | Gateway | no                      | End-user identifier for audit.                                                                                                       |
| `X-Session-Id`                   | Gateway | no                      | User session identifier.                                                                                                             |
| `X-Attached-Files`               | Gateway | no                      | JSON array of attachment descriptors for a separate audit copy in HiveTrace. Format: section 5.3.2.                                  |

---

## 5. Request Format

The request body matches the OpenAI Chat Completions / Embeddings payload. There are no gateway-specific fields in the body.

### 5.1. HTTP Examples

Minimal request:

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: 11111111-2222-3333-4444-555555555555" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

With user and session identification:

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

### 5.3. File Transfer

File transfer is supported through two strategies. They solve different tasks and can be used separately or together.

| Strategy                                   | File reaches the LLM | File reaches HiveTrace (audit) | OpenAI client changes |
| ------------------------------------------ | -------------------- | ------------------------------ | --------------------- |
| 5.3.1. OpenAI standard (multimodal)        | Yes                  | No                             | Not required          |
| 5.3.2. `X-Attached-Files` header           | No                   | Yes                            | One additional header |
| 5.3.3. Both strategies in a single request | Yes                  | Yes                            | One additional header |

#### 5.3.1. Strategy 1 - OpenAI Standard (Multimodal `messages[].content`)

Files are passed using the standard OpenAI method: an array of parts in `messages[].content`. The gateway does not interpret these parts and forwards the request body to the upstream unchanged.

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
        {"type": "text", "text": "What is in the image?"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBORw0KG..."}}
      ]
    }]
  }'
```

Behavior:

- **LLM.** Receives the request in the standard OpenAI multimodal format. Processing of `image_url`, `file`, and other non-text parts depends on the model and upstream.
- **HiveTrace.** Only the text part (`type: "text"`) is written to the `user_prompt` record. The contents of `image_url`, `file`, and other non-text parts are not stored in HiveTrace.
- **Client changes.** Not required. Any OpenAI client or SDK with multimodal support works without changes.

Use this when the file must be processed by the model without saving an audit copy of the file in HiveTrace.

#### 5.3.2. Strategy 2 - `X-Attached-Files` Extension

Files are passed in the `X-Attached-Files` header as a JSON array of descriptors. The gateway does not forward this header to the upstream; instead, it downloads or decodes the files and attaches them to the `user_prompt` audit record in HiveTrace.

Transfer through base64 (for local files):

```bash
B64=$(base64 -i ./test111.txt | tr -d '\n')
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -H "X-User-Id: alice@company.com" \
  -H "X-Attached-Files: [{\"name\":\"test111.txt\",\"content_base64\":\"$B64\",\"type\":\"text/plain\"}]" \
  -d '{ "model": "gpt-5", "messages": [{"role":"user","content":"User message"}] }'
```

Transfer through URL (the gateway downloads the file over HTTP/HTTPS):

```bash
curl -X POST http://gateway:4100/v1/chat/completions \
  -H "Authorization: Bearer <upstream-key>" \
  -H "X-HiveTrace-Api-Key: <gateway-key>" \
  -H "Content-Type: application/json" \
  -H "X-Application-Id: <APPLICATION_ID>" \
  -H "X-User-Id: alice@company.com" \
  -H 'X-Attached-Files: [{"url":"https://files.company.example/contract.pdf","name":"contract.pdf","type":"application/pdf"}]' \
  -d '{ "model": "gpt-5", "messages": [{"role":"user","content":"User message"}] }'
```

Descriptor format (`X-Attached-Files` is a JSON array; each item contains either `url` or `content_base64`):

| Field            | Type   | Description                                                                                           |
| ---------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `url`            | string | HTTP/HTTPS URL of the file. `data:` URIs with inline base64 are also supported.                       |
| `content_base64` | string | Base64-encoded file content. Alternative to `url`.                                                    |
| `name`           | string | File name. Used when saving to HiveTrace; inferred from the URL if missing.                           |
| `type`           | string | File MIME type. If missing, inferred from the extension or from the download response `Content-Type`. |

Header alias: `X-AttachedFiles`.

Behavior:

- **LLM.** The request body is sent to the upstream unchanged; `X-Attached-Files` is not forwarded to the upstream. If there is no inline file data in `messages[].content`, the model does not receive the file.
- **HiveTrace.** An audit copy of the file is additionally attached to the `user_prompt` record and linked to the request `analysis_id`.
- **Client changes.** One additional header. The request body remains a standard OpenAI payload.

Additional capabilities compared with strategy 1:

- An audit copy of the file is saved in HiveTrace regardless of whether the file is passed to the model.
- URL transfer is supported: the gateway downloads the file itself, so the client does not need to put the file content into the request payload.
- The full file content reaches HiveTrace, not only the text part of the request.

#### 5.3.3. Combined Scenario

If you need both (a) to pass the file to the LLM and (b) to save its audit copy in HiveTrace, use both strategies in a single request. `messages[].content` delivers the file to the model, and `X-Attached-Files` provides the audit copy in HiveTrace.

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
        {\"type\": \"text\", \"text\": \"Summarize the document.\"},
        {\"type\": \"file\", \"file\": {\"filename\": \"contract.pdf\", \"file_data\": \"data:application/pdf;base64,$B64\"}}
      ]
    }]
  }"
```

In this case:

1. `messages[].content` is passed to the upstream unchanged; the model receives the file through the standard OpenAI protocol.
2. `X-Attached-Files` is processed by the gateway in parallel: the file is decoded and attached to `user_prompt` in HiveTrace.
3. The model response is registered in HiveTrace through the standard post-call request.

Use this for compliance scenarios where both model-side file processing and audit of the original content in HiveTrace are required.

#### 5.3.4. Attachment Error Handling

A failure to download or decode a file (HTTP `>=400`, timeout, size exceeding `HIVETRACE_FILES_MAX_BYTES`, base64 decoding error) does not cause a client-facing failure. The gateway isolates such failures:

- The problematic file is not sent to HiveTrace. The gateway logs a warning with diagnostics (`Attachment download failed: url=… status=404`, and so on).
- Other files in `X-Attached-Files` are processed independently.
- The request body is passed to the upstream unchanged.
- The client receives a normal model response with the HTTP status returned by the upstream.

### Attachment Limits

| Parameter                     | Default | ENV                               |
| ----------------------------- | ------- | --------------------------------- |
| Maximum size of one file      | 20 MiB  | `HIVETRACE_FILES_MAX_BYTES`       |
| Parallel downloads            | 4       | `HIVETRACE_FILES_MAX_CONCURRENCY` |
| Download timeout for one file | 60 s    | `HIVETRACE_FILES_TIMEOUT`         |

A file that exceeds the limit is excluded from processing and a warning is written to the log; other attachments continue to be processed.

### 5.4. Request Body Size Limits

The gateway does not impose its own request body size limit. Size control is handled by the upstream.

---

## 6. Response Format

### 6.1. Successful Non-Streaming Response

The response body and HTTP status **fully match the upstream response**. Content type: `application/json`. The structure matches the standard OpenAI format:

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

### 6.2. Successful Streaming Response

`Content-Type: text/event-stream`. The response body is a sequence of SSE frames:

```
data: {"id":"…","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hel"}}]}

data: {"id":"…","object":"chat.completion.chunk","choices":[{"delta":{"content":"lo!"},"finish_reason":"stop"}]}

data: [DONE]

```

**Comment frames** may be sent between regular `data:` frames to keep the connection alive:

```
: keepalive

```

> A streaming response can be delivered to the user with monitoring enabled only in async mode.

### 6.3. Response Replacement by HiveTrace Policy

This is possible **only** when `app_mode=sync` is set in the per-app policy (Redis). If `mode=async` or the policy is not configured, the behavior described in this section is not applied to the request.

#### 6.3.1. Pre-Call Block (HiveTrace Rejected Before the LLM Call)

The request **was not sent** to the upstream. The gateway returns a synthesized `chat.completion` with a diagnostic `metadata.hivetrace` block:

```json
{
	"id": "hivetrace-guardrails-<uuid>",
	"object": "chat.completion",
	"created": 1717171717,
	"model": "<requested or 'unknown'>",
	"choices": [
		{
			"index": 0,
			"message": {
				"role": "assistant",
				"content": "<phrase from the application policy>"
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
				"request_id": "<metadata.request_id from the request body or a generated UUID>"
			},
			"prepared_response": { "...": "verdict context from HiveTrace" }
		}
	}
}
```

The client can detect replacement by checking for `metadata.hivetrace.response_replaced == true` or by the `id` prefix (`hivetrace-…`).

#### 6.3.2. Streaming + Sync Mode

In `sync` mode, the gateway **forcibly disables** `stream: true` by replacing it with `stream: false` before calling HiveTrace. The reason is that replacing an SSE response after transmission to the client has started is technically impossible. Therefore, in `sync` mode, the client always receives a non-streaming response, even if `body.stream` was set to `true`.

---

## 7. Errors

All errors returned to the client have the following shape:

```json
{"error": {"message": "...", "type": "...", "code": <int>}}
```

If the upstream already returns an OpenAI-formatted error (`{"error": {...}}`), the gateway passes it through **without an additional wrapper**, preserving the provider's original fields (`type`, `param`, `code`).

The `type` field is used to distinguish error sources:

- `invalid_request_error` - a client error rejected by the gateway or upstream.
- `upstream_error` - the upstream returned `>=400`, and the response body did not match the OpenAI-compatible format.
- `gateway_error` - the gateway could not successfully call the upstream. Always `code: 502`.
- `rate_limit_error`, `authentication_error`, and others - native values from OpenAI-compatible upstreams, passed through unchanged.

### 7.1. Complete Table

| Status | Source                      | Condition                                                                                                                                     | Type in `error.type`                  |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `400`  | gateway                     | Invalid JSON in the request body                                                                                                              | `invalid_request_error`               |
| `400`  | upstream                    | Business validation (missing `messages`, exceeded context window, and so on)                                                                  | `invalid_request_error` (passthrough) |
| `401`  | gateway                     | Missing or empty `X-HiveTrace-Api-Key` header                                                                                                 | `invalid_request_error`               |
| `401`  | upstream                    | `Authorization: Bearer` rejected by the upstream                                                                                              | `invalid_request_error` (passthrough) |
| `403`  | upstream                    | Authorization succeeded, but the action is forbidden (for example, organization without quota)                                                | passthrough                           |
| `404`  | upstream                    | The specified `model` does not exist                                                                                                          | `invalid_request_error` (passthrough) |
| `413`  | upstream / proxy            | Body is too large                                                                                                                             | `upstream_error`                      |
| `422`  | upstream                    | Payload failed validation (strict-mode schema)                                                                                                | passthrough                           |
| `429`  | upstream                    | Rate limit                                                                                                                                    | `rate_limit_error` (passthrough)      |
| `500`  | upstream                    | Internal upstream error                                                                                                                       | `upstream_error`                      |
| `502`  | gateway                     | Network error between the gateway and upstream (DNS, refused, TLS). Also `httpx.ReadTimeout` BEFORE the first byte on non-streaming requests. | `gateway_error`                       |
| `503`  | upstream                    | Upstream unavailable (maintenance, overload)                                                                                                  | `upstream_error`                      |
| `504`  | - _(SSE error frames only)_ | Mid-stream `httpx.TimeoutException`                                                                                                           | `upstream_error`                      |

---

## 8. Timeouts and Limits

### 8.1. Layer Timeouts

| Layer                                                            | Parameter                          | Default | Controlled by |
| ---------------------------------------------------------------- | ---------------------------------- | ------- | ------------- |
| Gateway -> upstream (single HTTP call)                           | `GATEWAY_UPSTREAM_TIMEOUT`         | 120 s   | gateway       |
| Gateway -> HiveTrace (`/process_request/`, `/process_response/`) | `HIVETRACE_TIMEOUT`                | 60 s    | gateway       |
| Gateway -> attachment URL (download)                             | `HIVETRACE_FILES_TIMEOUT`          | 60 s    | gateway       |
| Gateway -> client: SSE keepalive                                 | `GATEWAY_STREAM_HEARTBEAT_SECONDS` | 60 s    | gateway       |

---

## 9. Configuration

### 9.1. Minimum Environment Variables

```bash
# Upstream
UPSTREAM_URL=http://litellm:4000

# HiveTrace
HIVETRACE_URL=https://hivetrace.example.com/api
HIVETRACE_APPLICATION_ID=<default app uuid>

# Redis (for per-app policies; optional if blocking is not required)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_USER=""
REDIS_PASSWORD="admin"
REDIS_SSL=False
```

### 9.2. Behavior When HiveTrace Is Missing

If `HIVETRACE_URL` is not set, the gateway forwards requests to the upstream without sending telemetry to HiveTrace. When the module is imported, a warning is written to stderr: `HiveTrace is effectively disabled`.

The `X-HiveTrace-Api-Key` contract is preserved: the key remains required for client requests, although it is effectively unused when there is no HiveTrace connection. This mode is intended for debugging and resilient handling of configuration errors; in deployments, `HIVETRACE_URL` must be set explicitly.

### 9.3. Behavior When Redis Is Missing

If Redis is not configured, per-app blocking policies are unavailable; pre-call and post-call telemetry is sent to HiveTrace in `async` mode by default.
