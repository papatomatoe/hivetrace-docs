---
sidebar_position: 3
title: "Team Setup"
description: "Learn how to set up a developer team and delegate tasks"
---

# Team Setup

In this section you will learn how to set up developer and administrator teams in HiveTrace.

### Navigating to user management

1. Log in to the HiveTrace dashboard
2. Go to **System users** in the main menu
3. Here you can manage all system users

![System users management](/img/system_users.png)

### Adding new system users

#### Step 1: Create a user

1. Click the **Add** button
2. Fill out the form with the user's data:

#### Required fields
```yaml
email: "ivan.petrov@company.com"
username: "Ivan Ivanov"
role: "Administrator" | "Developer"
password: "xxx-xxx-xx"
```

::::note
The password must be at least 8 characters long
::::

### Managing existing users

#### Activation/deactivation

- **Deactivated users** lose access to the system until reactivated
- **Active users** can work in the system according to their permissions

#### Deleting users

> **⚠️ Warning**: Deleting a user is an irreversible operation!

### Access rights

#### Restrictions for developers

::::warning Access restrictions
Developers receive **limited access** to the system:

- ❌ **Managing system users is unavailable**
- ❌ **Viewing user messages is unavailable**
- ❌ **Viewing LLM responses is unavailable**
- ❌ **Managing policies is unavailable**
- ❌ **Data cleaning settings are unavailable**
- ❌ **Alert channel settings are unavailable**
- ✅ **Core development and integration functions are available**
- ✅ **Viewing alerts and dashboards**
- ✅ **Working with API and agents**
:::: 