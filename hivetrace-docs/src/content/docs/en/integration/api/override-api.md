---
title: "Override API"
sidebar:
  order: 4
---

## Override Endpoints

### `POST /process_request/override/`

For validating **incoming user messages** before they are sent to an LLM, when validation rules must be defined inline within the request instead of relying on Web UI settings.

---

### `POST /process_response/override/`

For validating **outgoing LLM responses** before they are returned to the end user, with validation configured directly in the request.

Override endpoints allow validation behavior to be defined inline, bypassing Web UI configuration.

**Important:**

- Web UI validation settings are **not applied**
- Validation is fully controlled via `validation_config`
- The corresponding services (**dataclean, guardrails, custom**) must still be enabled at the deployment level

---

## Request Body

### Required Fields

| Field               | Type            | Description                                             |
| ------------------- | --------------- | ------------------------------------------------------- |
| `application_id`    | `string` (UUID) | Application identifier. Must exist in HiveTrace.        |
| `message`           | `string`        | User message or LLM response depending on the endpoint. |
| `validation_config` | `object`        | Inline validation configuration.                        |

---

### Optional Fields

| Field                   | Type     | Description                             |
| ----------------------- | -------- | --------------------------------------- |
| `additional_parameters` | `object` | Metadata for session and user tracking. |

---

## Inline Validation (`validation_config`)

Defines validation rules directly inside the request.

### Example

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
				"patterns": ["CVC", { "name": "AUTOMOBILE", "regex": "\\bcar\\b" }]
			}
		}
	}
}
```

---

### `dataclean.patterns`: allowed values

`patterns` is a list of dataclean patterns. Each item can be:

- a string with a predefined pattern name
- an object with a custom pattern `{ "name": "...", "regex": "..." }`

Allowed values for **predefined** patterns:

| Pattern            | Description                          |
| ------------------ | ------------------------------------ |
| `ADDRESS`          | Address                              |
| `BANK_CARD_NUMBER` | Bank card number                     |
| `COMPANY`          | Company / organization               |
| `CVC`              | Card CVC/CVV                         |
| `DATE`             | Date                                 |
| `DEADLINE_DATE`    | Deadline date                        |
| `DIAGNOSIS`        | Diagnosis                            |
| `DOMAIN`           | Domain                               |
| `DURATION`         | Duration                             |
| `EMAILS`           | Email addresses                      |
| `INN`              | INN (taxpayer identification number) |
| `IP`               | IP address                           |
| `JOB_ROLE`         | Job role / position                  |
| `KPP`              | KPP                                  |
| `MONEY`            | Money amounts                        |
| `NAME`             | Person name                          |
| `OGRN`             | OGRN                                 |
| `OGRNIP`           | OGRNIP                               |
| `PASSPORT_NUMBER`  | Passport number                      |
| `PHONE_NUMBER`     | Phone number                         |
| `SNILS`            | SNILS                                |

---

### `dataclean.clean_type` (masking type): allowed values

| Masking type | Description                                           |
| ------------ | ----------------------------------------------------- |
| `MASKING`    | Masking: replaces matches with a mask                 |
| `DELETION`   | Deletion: removes matches from the text               |
| `DETECTION`  | Detection: detects matches without modifying the text |

---

## Response Schema

Override endpoints return the same response structure as the Base API.
