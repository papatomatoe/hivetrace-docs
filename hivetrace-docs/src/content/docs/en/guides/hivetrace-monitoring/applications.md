---
title: "Applications"
sidebar:
  order: 3
---

## Application Registration in HiveTrace

Go to the “Applications” section, click “Add New Application,” and complete the required fields.

![Application Registration](../../../../../assets/img/app.webp)

### For synchronous mode:

- Name — specify the application name.
- Description — provide a brief overview of the application’s purpose.
- Violation Response — a predefined message automatically returned to the user when a violation is detected.
- Blocking Scope — select which policy types should trigger blocking:
  - Data Clean — data cleansing and protection policies.
  - Guardrail — built-in protection against prompt injections and jailbreak attacks.
  - Custom — user-defined security policies.

### For asynchronous mode:

- Name
- Description

Once registered, the application will appear in HiveTrace. You can use the App ID for platform integration and manage security policy settings by opening the application card via the corresponding App ID.

## Application Settings and Management

Once you open the application card, you gain access to security policies, monitoring rules, and insights into users and multi-agent operations. These capabilities enable centralized governance of application security and AI interactions.

### Key Sections

- Agents — displays agents used within multi-agent systems, including those automatically detected or manually registered via the SDK.
- Users — provides a list of your application’s end users who interact with the AI service (for example, chatbot users).
- Policies — enables management of built-in Guardrail policies, configuration of Custom rules, and definition of token usage thresholds. When thresholds are exceeded, the system generates alerts with severity levels such as low, high, and critical.
- Personal Data Cleaning — offers tools to configure sensitive data detection patterns and define masking methods.
- Tracing — visualizes multi-agent workflows as a graph with detailed agent and tool calls, simplifying analysis of execution flows.
- Alert Configuration — allows you to specify notification channels such as email or Telegram. SIEM integrations are typically configured during deployment by the HiveTrace team or your organization’s DevOps engineer.
