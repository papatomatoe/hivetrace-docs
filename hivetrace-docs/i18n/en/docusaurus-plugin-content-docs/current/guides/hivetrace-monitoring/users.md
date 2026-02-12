---
title: "Users"
sidebar_position: 8
---

## Users

The **Users** page lists all end users of your AI application (for example, chatbot users) who interact with the model by sending messages. This section provides centralized user management and visibility into user activity.

![Page "Users"](/img/users_page.png)

From this page, you can:

* view the list of users;
* edit or delete existing users;
* add users manually.

Users can also be added **automatically**. When sending requests to HiveTrace, if you specify a new user identifier:

* in **additional parameters** when using the API or SDK, or
* in **HTTP headers** when using a proxy,

the user will be created automatically and appear in the list. In this case, the record will contain only the **user ID** — user names can be added manually via the interface if needed.

### User Details

Clicking on a user ID opens a detailed view of their activity. The **“Sessions” tab is displayed by default**, located next to the **“Files”** tab.

![Users Sessions](/img/users_sessions.png)

The **Sessions** tab provides a history of the user’s interactions with the application, enabling analysis of individual conversations.

Switching to the **Files** tab displays all files uploaded by the user during chatbot interactions.

![Users Files](/img/users_files.png)

> **Important:** uploaded file contents are **not automatically scanned, censored, or analyzed**. Files are available only for manual review and download and are not processed by security or monitoring policies.
