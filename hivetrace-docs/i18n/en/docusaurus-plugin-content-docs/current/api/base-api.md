---
title: "Base API"
sidebar_position: 3
---

## Base API

### Base Endpoints

#### `POST /process_request/`

Use this endpoint to analyze **user messages before they are sent to an LLM** using validation rules configured in the Web UI.

When enabled, HiveTrace performs:

* sensitive data detection and masking (dataclean)
* built-in policy validation (guardrails)
* custom policy validation
* token usage calculation
* session/user association
* monitoring persistence

---

#### `POST /process_response/`

Use this endpoint to analyze **LLM responses before they are returned to the end user** using Web UI validation settings.

When enabled, HiveTrace performs:

* sensitive data detection and masking (dataclean)
* built-in policy validation (guardrails)
* token usage calculation
* session/user association
* monitoring persistence

> **Note:** Custom policies are applied **only** to `/process_request/`.

---

### Request Body

#### Required Fields

| Field            | Type            | Description                                             |
| ---------------- | --------------- | ------------------------------------------------------- |
| `application_id` | `string` (UUID) | Application identifier. Must exist in HiveTrace.        |
| `message`        | `string`        | User message or LLM response depending on the endpoint. |

---

#### Optional Fields

| Field                   | Type     | Description                             |
| ----------------------- | -------- | --------------------------------------- |
| `additional_parameters` | `object` | Metadata for session and user tracking. |

---

### additional_parameters Structure

| Field        | Type     | Description                  |
| ------------ | -------- | ---------------------------- |
| `user_id`    | `string` | External user identifier.    |
| `session_id` | `string` | External session identifier. |

---

### Response Schema

Both endpoints return a JSON object.

| Field                    | Type             | Description                                                 |
| ------------------------ | ---------------- | ----------------------------------------------------------- |
| `request_id`             | `string`         | Analysis record UUID.                                       |
| `schema_version`         | `string`         | Response schema version.                                    |
| `status`                 | `string`         | `success \| partial_success \| error`                       |
| `errors`                 | `string[]`       | List of processing errors (may be empty).                   |
| `tokens.count`           | `integer`        | Number of tokens processed.                                 |
| `tokens.usage_severity`  | `string \| null` | `low \| high \| critical`                                   |
| `guardrails.flagged`     | `boolean`        | Indicates built-in policy violations.                       |
| `custom_policy.flagged`  | `boolean`        | Indicates custom policy violations.                         |
| `dataclean.flagged`      | `boolean`        | Indicates sensitive data was detected.                      |
| `dataclean.cleaned_text` | `string \| null` | Sanitized version of the message after masking or cleaning. |
| `dataclean.types[]`      | `array`          | Detected entity types with counts.                          |

#### dataclean.types structure

```json
{
  "type": "NAME",
  "count": 1
}
```

---

### Example Requests

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

### Example Response

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
