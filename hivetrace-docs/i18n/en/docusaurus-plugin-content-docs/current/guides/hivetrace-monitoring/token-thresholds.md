---
title: "Token Thresholds"
sidebar_position: 6
---

## Token Thresholds

The **Token Thresholds** configuration is available within the **Policies** section and is used to control the size of individual requests and model responses. Thresholds help detect and limit abnormal or resource-intensive interactions at the level of a single request.

![Page "Policies"](/img/policy_page.png)

Thresholds can be configured separately for:

* **Input** — the number of tokens in the user’s request;
* **Output** — the number of tokens in the model’s response.

Multiple severity levels are supported:

* **Low** — a warning level indicating that usage is approaching the limit;
* **High** — signals a significant deviation from expected message size;
* **Critical** — a critical threshold that may require immediate attention or enforcement actions.

Token thresholds are evaluated **per individual request**, enabling precise control over input and output sizes and helping maintain predictable and secure AI application behavior.