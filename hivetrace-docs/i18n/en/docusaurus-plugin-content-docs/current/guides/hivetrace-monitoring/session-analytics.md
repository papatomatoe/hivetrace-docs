---
title: "Session analytics"
sidebar_position: 9
---

## Session Analytics

The **Session Analytics** page provides centralized visibility into all interactions between users and your AI applications. It displays both user messages sent to chatbots and model responses, enabling communication audits, violation detection, and behavioral analysis.

The primary component of the page is a table containing session data.

![Page "Session Alalytics"](/img/sessions_page.png)

### Default Table Columns

| Field       | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| Session ID  | Unique identifier of the interaction session                                               |
| User ID     | Unique identifier of the user                                                              |
| User Name   | User’s name, if provided                                                                   |
| Application | The application where the interaction occurred                                             |
| Message     | The user request or model response                                                         |
| Violation   | Type of detected violation                                                                 |
| Policy      | Policy under which the violation was identified (**Guardrail**, **Custom**, **DataClean**) |
| Direction   | Message direction — **input (in)** or **output (out)**                                     |
| Date        | Date and time of the event                                                                 |

### Optional Columns

The table may also include the following fields:

| Field           | Description                                 |
| --------------- | ------------------------------------------- |
| Processing Time | Duration of request processing              |
| Agents          | Agents involved in a multi-agent workflow   |
| Files           | Indicates files uploaded during the session |

The **Session Analytics** page improves operational transparency, simplifies incident investigations, and strengthens oversight of security policy enforcement across AI applications.
