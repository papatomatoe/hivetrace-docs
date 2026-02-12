---
sidebar_position: 9
title: "Alerts"
---

# Alerts

This section describes how to configure the alerting system for critical events and security policy violations in your AI application.

## Overview

The **Alerts** page provides centralized management of notifications:

- **Channel setup** — configure Telegram bot and email to receive alerts
- **History view** — table of all recorded alerts with detailed information
- **Incident analysis** — quick access to related sessions and traces

::::tip Recommendation
Configure at least one alert channel to respond promptly to critical security incidents.
::::

## Alert channels setup

HiveTrace supports several channels for alert delivery:

- Telegram bot
- Email
- SIEM system


### SIEM integration
Integration with SIEM (Security Information and Event Management) systems enables centralized security event management.

::::note SIEM setup
SIEM integration is configured at the deployment and application configuration level. Contact your administrator or technical support to set up this channel.
::::

---

::::tip Important
If channels are not configured, alerts will be available only on the HiveTrace platform.
::::

## Alerts table

The alerts table displays all recorded security incidents with filtering and drill-down.

### Basic information

- **ID** — unique alert identifier  

- **Channel** — the delivery channel (Telegram/Email/SIEM)  
  *An empty value means channels are not configured*

- **Session** — link to the full conversation  
  *Click to view the entire interaction history*

- **Trace** — link to the interaction graph of agents and tools  
  *Available only for multi-agent systems*

### Violation types

The system generates alerts for three incident types:

- **`custom_policy_violation`** — violation of custom policies  
  *Example: user tries to discuss topics forbidden by your rules*

- **`default_policy_violation`** — violation of built-in Guardrail rules  
  *Example: prompt injection, jailbreak, harmful content generation*

- **`token_usage`** — exceeding the configured token limit  
  *Example: abnormally long prompts or responses, potential resource abuse*

::::warning Attention
`token_usage` alerts may indicate attempts to abuse resources.
::::

### Direction

Indicates the incident source:

- **`In` (incoming)** — alert caused by user messages  
  *Analyze user intent and adjust policies*

- **`Out` (outgoing)** — alert caused by model responses  
  *May indicate the need to refine prompts*

### Threat levels

- **Low**
- **High**
- **Critical**


### Timestamps

- **Date and Time**