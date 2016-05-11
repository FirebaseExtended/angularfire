# Migrating from AngularFire 1.x.x to 2.x.x

This migration document covers all the major breaking mentioned in the AngularFire 2.0.0 change log.

**Note** If you're using Angular2 this is not the guide for you. This is for upgrading AngularFire 1.x.x (for classic Angular) to AngularFire 2.x.x

# Upgrade your Firebase SDK

Ensure you're using a Firebase SDK 3.x.x in your project.

| SDK Version | AngularFire Version Supported |
|-------------|-------------------------------|
| 3.x.x | 2.x.x |
| 2.x.x | 1.x.x |


# $firebaseAuth Updates

| Old Method | New Method | Notes |
|------------|------------|------------------|
| $authAnonymously(options) | $signInAnonymously() | No longer takes any arguments |
| $authWithCustomToken(token) | $signInWithCustomToken(token) | |
| $authWithOAuthPopup(provider[, options]) | $signInWithPopup(provider) | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| $authWithOAuthRedirect(provider[, options]) | $signInWithRedirect(provider) | `options` can be provided by passing a configured `firebase.database.AuthProvider` instead of a `provider` string |
| $createUser(credentials) | $createUserWithEmailAndPassword(email, password) | |
| $removeUser(credentials) | $deleteUser() | This method deletes the currently logged in user. |
| $changeEmail(credentials) | $updateEmail(newEmail) | This methods changes the email of the currently logged in user. |
| $changePassword(credentials) | $updatePassword(newPassword) | This method changes the password of the currently logged in user. |
| $resetPassword(credentials) | $sendPasswordResetEmail(newEmail) | |
| $unauth() | $signOut() | |
| $onAuth(callback) | $onAuthStateChanged(callback) | &nbsp; |

# Auth Payload Notes

Although all your promises and `$getAuth()` calls will continue to function, the auth payload will differ slightly. Ensure that your code is expecting the new payload that is documented in the [Firebase Authentication for Web documentation](https://firebase.google.com/docs/auth/).
