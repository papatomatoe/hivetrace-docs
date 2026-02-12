---
sidebar_position: 8
title: "Monitoring and Control"
---

# Monitoring and Control

This section describes the capabilities for monitoring sessions, analyzing security policy violations, and controlling your AI application's operation.

## Session analytics

The **Session Analytics** page provides tools for real-time monitoring of all user interactions with your AI application.

### Key features

**Violation heatmap** — a visualization of policy violation activity by day. Helps quickly identify:
- Periods of increased violation activity
- Trends over a selected period
- Anomalous spikes

**Summary table** — detailed information on all user messages and model responses with filtering and search.

## Monitoring table structure

### Basic information

- **Session ID** — unique identifier of the user's chat session in your application  
  *Use it to trace the full conversation history*

- **User** — the name/id of the user to whom the entry relates (message sender)

- **Application** — the name of the application created on the "Applications" page  
  *Useful when monitoring multiple applications at once*

- **Date** — the date and time the message was sent/received

- **Violation** — a tag with the detected policy violation type

### Violation types

The system tracks three types of violations:

- **Guardrail** — violation of built-in safety rules  
  *For example: prompt injection, jailbreak, harmful content requests*

- **Custom** — violation of user-defined (custom) policies  
  *For example: discussing topics forbidden by your rules*

- **Dataclean** — detection of sensitive data leakage  
  *For example: personal data, card numbers, passwords in messages*

::::tip Tip
Regularly analyze violation types to understand which threats are most relevant to your application.
::::

### Messages and agents

- **Msg** — full text of the user's message or the model's response  

- **Agents** — list of agents that processed the current message  
  *Displayed only for multi-agent systems*

- **Direction** — interaction type:
  - `In` (incoming) — message from the user
  - `Out` (outgoing) — model response

### Additional functions

- **Alerts** — view all violations in the session that triggered alerts  
  *Button is active only for sessions with recorded alerts*

- **Trace** — visualization of the interaction graph of agents and tool calls  
  *Available only for records with agent architectures*

::::note
Tracing is especially useful when debugging complex multi-agent systems to understand the sequence of request processing.
::::