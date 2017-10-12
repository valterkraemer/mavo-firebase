# Mavo-firebase

A Firebase backend plugin for [Mavo](https://mavo.io).

## Examples

- To-Do List - ([DEMO](https://valterkraemer.github.io/mavo-firebase/examples/todo/))
- [Authentication (High score example)](https://github.com/valterkraemer/mavo-firebase/tree/master/examples/authentication) - ([DEMO](https://valterkraemer.github.io/mavo-firebase/examples/authentication/))

## Tip

Also check out [mavo-offline-interceptor](https://github.com/valterkraemer/mavo-offline-interceptor) for 4-way data-binding.

## Setup mavo-firebase

Add Firebase and initialize it in the `<head>` of your HTML file.

    <script src="https://www.gstatic.com/firebasejs/4.3.0/firebase.js"></script>
    <script src="path/to/mavo-firebase.js"></script>
    <script>
      firebase.initializeApp({
        apiKey: '...',
        authDomain: '...',
        databaseURL: '...',
        projectId: '...',
        storageBucket: '...',
        messagingSenderId: '...'
      });
    </script>

Check out the [Setup Firebase](#setup-firebase) section to find out how to set up a Firebase database.

## Attributes

| Attribute                            | Default                              | Description                             |
|:------------------------------------ |:------------------------------------ |:--------------------------------------- |
| `authenticated-permissions`          | `"read login"`                       | Permissions for an unauthenticated user |
| `unauthenticated-permissions`        | `"read edit add delete save logout"` | Permission for an authenticated user    |

E.g.
```
<main mv-app="todo"
  mv-storage="firebase"
  unauthenticated-permissions="read edit save">

  ...
```

## Setup Firebase

Login or signup at https://console.firebase.google.com

### Create a new project

![1-add-project](assets/images/1-add-project.png "Add project")

![2-create-project](assets/images/2-create-project.png "Create project")

### Get your project's config details

Insert these values into the `firebase.initializeApp` in your app.

![3-add-firebase-to-your-web-app](assets/images/3-add-firebase-to-your-web-app.png "Add firebase to your web app")

![4-view-config](assets/images/4-view-config.png "View config")

### Setup database rules

To be able to read and write to the database we will make it public.

![5-go-to-database](assets/images/5-go-to-database.png "Go to database")

![6-go-to-rules](assets/images/6-go-to-rules.png "Go to rules")

Set `.read` and `.write` to `true`. Remember to click "Publish".

**Warning:** After this step anyone can read and write to your database.

![7-edit-rules](assets/images/7-edit-rules.png "Edit rules")
