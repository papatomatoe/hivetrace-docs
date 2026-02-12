---
title: "Censorship policies"
sidebar_position: 4
---

## Policy Management

The Policies section allows you to configure security rules applied to user inputs and model outputs. Here you can manage built-in Guardrail protections, create Custom policies based on your own prompts, and control token usage thresholds.

> For details on configuring token limits, refer to the [Token Thresholds](./token-thresholds)

![Page "Policies"](/img/policy_page.png)

### HiveTrace Guardrail

HiveTrace Guardrail is a built-in set of protective mechanisms delivered and maintained by the HiveTrace team. Guardrail policies have a fixed configuration and cannot be modified, ensuring a consistent and validated level of security.

Within this section, you can enable or disable Guardrail independently for:
- incoming user messages (input);
- model responses (output).

Guardrail protects against a broad range of threats, including prompt injections, jailbreak attempts, and other efforts to manipulate model behavior. It also helps detect and block clearly harmful or unsafe content originating from either the user or the model.

### Creating a Custom Policy

To create a custom policy, navigate to “Custom / Individual Policies” and click “Add New Policy.”

In the configuration panel:
- enter a policy name;
- define the rule in the Prompt field.

Note: Custom policies apply to incoming messages only (input).

A testing panel on the right allows you to validate the policy before enabling it. Submit sample messages to immediately see how they are evaluated.

Example:  
If the policy allows discussions strictly related to banking products (loans, cards, transfers, accounts, etc.), a request such as “How can I deposit money into my account?” will be accepted. Conversely, a message like “Recommend medicine for a cold” will be flagged as a violation because it falls outside the permitted scope.

> Important: In addition to your prompt, Custom policies are reinforced by built-in safety mechanisms that detect clearly harmful requests. For instance, attempts to obtain instructions for creating weapons or explosives will be flagged regardless of the custom rule.

![Check Custom Policy](/img/check_custom_policy.png)