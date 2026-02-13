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

### Setting up a Custom policy in HiveTrace

This section explains how to configure a Custom policy for topical validation of requests and responses. The policy helps your bot stay within a defined domain and block off-topic content.

#### 1) What a Custom policy does

- The policy checks whether the text matches an **allowlist of topics**. If the topic is not recognized as allowed, it blocks the message using a **deny by default** approach.
- When triggered, the policy marks the event with `custom_flagged=true`.
- You can enable the policy:
  - on **input** (validate the user request before calling the main model)
- The policy evaluates **topical relevance**. It does not replace fact-checking or completeness checks.

#### 2) How to write a policy prompt

A prompt is a compact description of the allowed domain. A short list of **semantic topics** works better than a list of individual questions.

- Write **topics**, not questions: eras, people, wars, terms, chronology, reading lists, learning tasks.
- Keep it short: typically **7–15** items are enough.
- Use the same language and phrasing as your users. For chatbots, you can add 1–2 short dialogue-style lines.
- After setup, run real test cases and refine the wording if you see false positives/negatives.

Example prompt for the “History” domain:

- Historical dates, years, centuries, and converting date formats (BCE/CE).
- Chronology and sequencing of historical events.
- Causes, course, and outcomes of wars, treaties, and changes of power.
- Historical figures, states, alliances, and key terms.
- Short “what happened in year X” explanations and definitions in historical context.

#### 3) Step-by-step setup in the HiveTrace UI

1. Open the target application in HiveTrace.
2. Go to the “Policies” tab.
3. Create or edit a policy and select a **Custom** policy.
4. Fill in the “Name” field (e.g., “History”).
5. Paste your allowlisted topics into the “Prompt” field (see section 2).
6. Enable **Input** if you want to record irrelevant requests before they reach the model.
7. Click “Save”.

On the right side, there’s a testing panel where you can submit sample messages and immediately see the validation result.

![Custom policy editor and test messages](/img/check_custom_policy.png)

#### 4) Testing and debugging

- Prepare test cases: clearly relevant, clearly irrelevant, and borderline.
- Verify that relevant messages pass and irrelevant ones are blocked.
- If relevant content is blocked, expand or rephrase the topic list to cover the required wording and contexts.
- If irrelevant content passes, make topics more specific: remove overly broad terms and add clearer domain signals.
- Test directions separately: if only **Output** is enabled, an irrelevant request may pass on input, but the response can still be blocked.

#### 5) What happens when it triggers

When triggered, the policy sets `custom_flagged=true`.

#### 6) Summary

A Custom policy is a relevance classifier: it checks whether a message belongs to the allowlisted topics defined in the policy. If it doesn’t, the message is treated as irrelevant and can be blocked or flagged for monitoring.