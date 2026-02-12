---
title: "Overview"
slug: /api
sidebar_position: 1
---

## Overview

HiveTrace provides server-side APIs for monitoring, validating, and moderating LLM interactions. The platform analyzes both incoming user messages and outgoing model responses using configurable validation modules.

HiveTrace can be integrated into an application pipeline to enforce safety controls, detect sensitive data, apply policies, and persist monitoring results before data reaches a model or an end user.

**Supported modules:**

* **Dataclean** — detection and masking/cleaning of sensitive data
* **Guardrails** — built-in policy validation
* **Custom Policies** — user-defined validation rules
* Token accounting
* Session / user binding
* Monitoring persistence
