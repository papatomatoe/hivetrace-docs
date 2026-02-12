---
sidebar_position: 5
title: "Censorship Policies Setup"
---

# Censorship Policies Setup

This section describes how to configure censorship policies to control the content of user requests and LLM responses inside your AI application.

## Overview

HiveTrace provides two protection layers to secure your application:

- **Guardrail** — built-in module with preset safety rules
- **Custom policies** — configurable rules tailored to your business needs

You can also manage token limits to define alert thresholds.

![HiveTrace censorship policies](/img/policy.png)

## Guardrail

Guardrail is a built-in censorship module with preset safety rules.

**When to use:**
It is recommended to enable Guardrail for all applications as a baseline protection.

## Custom policies

Custom policies allow you to configure additional censorship rules for your application's specifics.

::::note Important
Custom policies censor **only incoming user requests**, not model responses.
::::

### How custom policies work

Policies are defined as a system prompt and specify:
- Allowed topics for discussion
- Prohibited topics and types of requests
- Rules for user behavior when using the LLM

### Creating a custom policy

**Steps to create:**

1. In the **Custom policies** section click **Add**
3. Enter a policy name
4. Describe allowed and prohibited topics
5. Save and activate the policy

### Examples of custom policies

#### Example 1: Retail bot policy

```
Only topics related to orders, delivery, payment, returns, warranties and product consultation are allowed, including characteristics, availability, promotions and compatibility.

Any conversation outside these topics – personal questions, philosophical reflections, flirting, discussions about politics, medicine, technology, education, social issues and other topics not related to shopping – is prohibited and considered a policy violation.
```

#### Example 2: Banking bot policy

```
Only topics directly related to banking products are allowed: loans, debit and credit cards, installment plans, transfers, payments, account information, limits, fees, rules for using bank services and security of banking operations.

Topics outside the banking sphere — medicine, education, IT, technology, entertainment, politics, philosophy and personal questions — are prohibited.
```

## Testing a custom policy

Before activating a policy, we recommend testing it manually.

**How to test:**

1. In **Custom policies** select the desired policy and click **Edit**
3. Click **Check**
4. Enter a test user request
5. Verify that the policy correctly detects violations

![Testing custom policies in HiveTrace](/img/check_custom_policy.png)

::::tip Recommendation
Test the policy on different types of requests: allowed, borderline, and explicitly prohibited to ensure it works correctly.
::::

## Best practices

- **Be specific**: Clearly define allowed and prohibited topics
- **Test**: Always check the policy before activation
- **Combine**: Use Guardrail together with custom policies for maximum protection
- **Update**: Regularly review and update policies as your application evolves 