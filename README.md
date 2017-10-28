# Mavo-firebase

A Firebase backend plugin for [Mavo](https://mavo.io).

Mavo-firebase is made to work with [mavo-offline-interceptor](https://github.com/valterkraemer/mavo-offline-interceptor) that enables changes to be pushed from the server and offline support.

## Examples

- [To-do list](https://github.com/valterkraemer/mavo-firebase/tree/master/examples/todo) - ([DEMO](https://valterkraemer.github.io/mavo-firebase/examples/todo/))
- [High score (Authentication)](https://github.com/valterkraemer/mavo-firebase/tree/master/examples/authentication) - ([DEMO](https://valterkraemer.github.io/mavo-firebase/examples/authentication/))

## Quick setup

Add Firebase and mavo-firebase to the `<head>` of your HTML file.

    <script src="https://www.gstatic.com/firebasejs/4.4.0/firebase.js"></script>
    <script src="path/to/mavo-firebase.js"></script>

**Tip:** *Check out the [Setup Firebase](#setup-firebase) section to find out how to set up a Firebase database.*

Set `mv-storage` to your Firebase database url, `firebase-api-key` to your api-key and `unauthenticated-permissions="read edit save"` if you want unauthenticated users to be able to edit and save.

```
<main mv-app="todo"
  mv-storage="https://databaseName.firebaseio.com"
  firebase-api-key="apiKey"
  unauthenticated-permissions="read edit save">

  ...
```

## Attributes

| Attribute                     | Description                             | Example                               |
|:------------------------------|:--------------------------------------- |:------------------------------------- |
| `mv-storage`                  | Database url (required)                 | `https://databaseName.firebaseio.com` |
| `firebase-api-key`            | Api-key (required)                      | `AdsfgDGFf-asdfGFDdfsdf5A-4ASFDgfhdf` |
| `firebase-auth-domain`        | Auth domain to enable login             | `projectId.firebaseapp.com`           |
| `firebase-storage-bucket`     | Storage bucket to enable file uploading | `bucket.appspot.com`                  |

#### Permission attributes

| Attribute                     | Default                                 | Description                           |
|:----------------------------- |:--------------------------------------- |:------------------------------------- |
| `authenticated-permissions`   | `"read login"`                          | Permissions for unauthenticated users |
| `unauthenticated-permissions` | `"read edit add delete save logout"`    | Permissions for authenticated users   |

Your Mavo id will be used as name for the root object in database.

## Setup Firebase

Login or signup at https://console.firebase.google.com

### Create a new project

![1-add-project](assets/images/1-add-project.png "Add project")

![2-create-project](assets/images/2-create-project.png "Create project")

### Get your project's config details

Set the [attributes](#attributes) to the values from the config.

![3-add-firebase-to-your-web-app](assets/images/3-add-firebase-to-your-web-app.png "Add firebase to your web app")

![4-view-config](assets/images/4-view-config.png "View config")

### Setup database rules

We will make the database public so that we can read and write to it.

![5-go-to-database](assets/images/5-go-to-database.png "Go to database")

![6-go-to-rules](assets/images/6-go-to-rules.png "Go to rules")

Set `.read` and `.write` to `true`. Remember to click "Publish".

**Warning:** After this step anyone can read and write to your database.

![7-edit-rules](assets/images/7-edit-rules.png "Edit rules")
