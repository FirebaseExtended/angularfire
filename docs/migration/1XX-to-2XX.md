# Migrating from AngularFire `1.x.x` to `2.x.x`

This migration document covers all the major breaking changes mentioned in the [AngularFire `2.0.0`
change log](https://github.com/firebase/angularfire/releases/tag/v2.0.0).

**Note:** If you're using Angular 2 this is not the guide for you! This is for upgrading AngularFire
`1.x.x` (for classic Angular) to AngularFire `2.x.x`. See [AngularFire 2](https://github.com/angular/angularfire2)
to use Firebase with Angular 2.


## Upgrade your Firebase SDK

Ensure you're using a `3.x.x` version of the Firebase SDK in your project. Version `2.x.x` of the
Firebase SDK is no longer supported with AngularFire version `2.x.x`.

| SDK Version | AngularFire Version Supported |
|-------------|-------------------------------|
| 3.x.x | 2.x.x |
| 2.x.x | 1.x.x |


## `$firebaseAuth` Updates

Several authentication methods have been renamed and / or have different return values.

| Old Method | New Method | Notes |
|------------|------------|------------------|
| `$authAnonymously(options)` | `$signInAnonymously()` | No longer takes any arguments |
| `$authWithCustomToken(token)` | `$signInWithCustomToken(token)` | |
| `$authWithOAuthPopup(provider[, options])` | `$signInWithPopup(provider)` | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| `$authWithOAuthRedirect(provider[, options])` | `$signInWithRedirect(provider)` | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| `$createUser(credentials)` | `$createUserWithEmailAndPassword(email, password)` | |
| `$removeUser(credentials)` | `$deleteUser()` | Deletes the currently logged in user |
| `$changeEmail(credentials)` | `$updateEmail(newEmail)` | Changes the email of the currently logged in user |
| `$changePassword(credentials)` | `$updatePassword(newPassword)` | Changes the password of the currently logged in user |
| `$resetPassword(credentials)` | `$sendPasswordResetEmail(email)` | |
| `$unauth()` | `$signOut()` | |
| `$onAuth(callback)` | `$onAuthStateChanged(callback)` | &nbsp; |


## Auth Payload Notes

Although all your promises and `$getAuth()` calls will continue to function, the auth payload will
differ slightly. Ensure that your code is expecting the new payload that is documented in the
[Firebase Authentication for Web documentation](https://firebase.google.com/docs/auth/).
