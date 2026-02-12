---
title: "System design"
sidebar_position: 3
---

# System design

This section outlines integration principles that make the system:

- **reliable** (does not break critical user flows)
- **observable** (you can correlate what was sent and what was applied)
- **safe** (data is handled and minimized appropriately)

## Recommendations

- **Fail-open on critical paths**: if monitoring is temporarily unavailable, avoid blocking core user scenarios unless you intentionally choose to.
- **Correlation**: pass `session_id` / `user_id` via `additional_parameters` to speed up investigations.
- **Send both input and output**: it improves trace completeness.

