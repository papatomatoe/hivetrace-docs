---
title: "System users"
sidebar_position: 12
---

## System Users

The **System Users** page is used to manage accounts that have access to the HiveTrace administrative interface. These users are typically team members responsible for monitoring, configuration, and platform integration.

From this page, you can:

* view the list of system users;
* create new accounts;
* delete users;
* deactivate accounts without fully removing access.

![Page "System users"](/img/system_users_page.png)

### System Users Table

The page displays a table with the following columns:

| Field      | Description                     |
| ---------- | ------------------------------- |
| Email      | User’s email address            |
| Username   | Display name of the user        |
| Role       | Assigned system role            |
| Active     | Account status                  |
| Last Login | Date and time of the last login |

### Adding a System User

To add a new system user, click **“Add New User.”**
In the modal window, fill in the following fields:

* **Username**
* **Email**
* **Role**
* **Password**

Once saved, the user will be granted access according to the assigned role.

### User Roles

HiveTrace supports two system roles:

* **Administrator** — has full access to all system capabilities. Administrators can manage applications, policies, alerts, view user sessions and analytics, and create, delete, or manage system users.

* **Developer** — intended for application integration with HiveTrace. Users with this role can:

  * view alerts;
  * create applications;
  * generate API tokens for integration.

  Developers **do not have access to session data** (they cannot see user messages or model responses) and **cannot manage system users**. This role follows the principle of least privilege and provides only the permissions required for integration and operation.
