# Migrating from AngularFire `1.x.x` to `2.x.x`

This migration document covers all the major breaking changes mentioned in the [AngularFire `2.0.0`
change log](https://github.com/firebase/angularfire/releases/tag/v2.0.0).

**Note:** If you're using Angular 2 this is not the guide for you! This is for upgrading AngularFire
`1.x.x` (for classic Angular) to AngularFire `2.x.x`. See [AngularFire 2](https://github.com/angular/angularfire2)
to use Firebase with Angular 2.


## Upgrade to the Firebase `3.x.x` SDK

Ensure you're using a `3.x.x` version of the Firebase SDK in your project. Version `2.x.x` of the
Firebase SDK is no longer supported with AngularFire version `2.x.x`.

| SDK Version | AngularFire Version Supported |
|-------------|-------------------------------|
| 3.x.x | 2.x.x |
| 2.x.x | 1.x.x |

Consult the Firebase [web / Node.js migration guide](https://firebase.google.com/support/guides/firebase-web)
for details on how to upgrade to the Firebase `3.x.x` SDK.


## `$firebaseAuth` Method Renames / Signature Changes

The `$firebaseAuth` service now accepts an optional Firebase `auth` instance instead of a Firebase
Database reference.

```js
// Old
$firebaseAuth(ref);

// New
$firebaseAuth();
// Or if you need to explicitly provide an auth instance
$firebaseAuth(firebase.auth());
```

Several authentication methods have been renamed and / or have different method signatures:

| Old Method | New Method | Notes |
|------------|------------|------------------|
| `$authAnonymously(options)` | `$signInAnonymously()` | No longer takes any arguments |
| `$authWithPassword(credentials)` | `$signInWithEmailAndPassword(email, password)` | |
| `$authWithCustomToken(token)` | `$signInWithCustomToken(token)` | |
| `$authWithOAuthPopup(provider[, options])` | `$signInWithPopup(provider)` | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| `$authWithOAuthRedirect(provider[, options])` | `$signInWithRedirect(provider)` | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| `$authWithOAuthToken(provider, token)` | `$signInWithCredential(credential)` | Tokens must now be transformed into provider specific credentials. This is discussed more in the [Firebase Authentication guide](https://firebase.google.com/docs/auth/#key_functions). |
| `$createUser(credentials)` | `$createUserWithEmailAndPassword(email, password)` | |
| `$removeUser(credentials)` | `$deleteUser()` | Deletes the currently signed-in user |
| `$changeEmail(credentials)` | `$updateEmail(newEmail)` | Changes the email of the currently signed-in user |
| `$changePassword(credentials)` | `$updatePassword(newPassword)` | Changes the password of the currently signed-in user |
| `$resetPassword(credentials)` | `$sendPasswordResetEmail(email)` | |
| `$unauth()` | `$signOut()` | Now returns a `Promise` |
| `$onAuth(callback)` | `$onAuthStateChanged(callback)` | |
| `$requireAuth()` | `$requireSignIn()` | |
| `$waitForAuth()` | `$waitForSignIn()` | |

## Auth Payload Format Changes

Although all your promises and `$getAuth()` calls will continue to function, the auth payload will
differ slightly. Ensure that your code is expecting the new payload that is documented in the
[Firebase Authentication guide](https://firebase.google.com/docs/auth/).
