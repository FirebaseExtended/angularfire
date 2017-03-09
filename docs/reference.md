# API Reference | AngularFire

## Table of Contents

* [Initialization](#initialization)
* [`$firebaseObject`](#firebaseobject)
  * [`$remove()`](#remove)
  * [`$save()`](#save)
  * [`$loaded()`](#loaded)
  * [`$ref()`](#ref)
  * [`$bindTo(scope, varName)`](#bindtoscope-varname)
  * [`$watch(callback, context)`](#watchcallback-context)
  * [`$destroy()`](#destroy)
  * [`$resolved`](#resolved)
* [`$firebaseArray`](#firebasearray)
  * [`$add(newData)`](#addnewdata)
  * [`$remove(recordOrIndex)`](#removerecordorindex)
  * [`$save(recordOrIndex)`](#saverecordorindex)
  * [`$getRecord(key)`](#getrecordkey)
  * [`$keyAt(recordOrIndex)`](#keyatrecordorindex)
  * [`$indexFor(key)`](#indexforkey)
  * [`$loaded()`](#loaded-1)
  * [`$ref()`](#ref-1)
  * [`$watch(cb[, context])`](#watchcb-context)
  * [`$destroy()`](#destroy-1)
  * [`$resolved`](#resolved-1)
* [`$firebaseAuth`](#firebaseauth)
  * Authentication
    * [`$signInWithCustomToken(authToken)`](#signinwithcustomtokenauthtoken)
    * [`$signInAnonymously()`](#signinanonymously)
    * [`$signInWithEmailAndPassword(email, password)`](#signinwithemailandpasswordemail-password)
    * [`$signInWithPopup(provider)`](#signinwithpopupprovider)
    * [`$signInWithRedirect(provider[, options])`](#signinwithredirectprovider-options)
    * [`$signInWithCredential(credential)`](#signinwithcredentialcredential)
    * [`$getAuth()`](#getauth)
    * [`$onAuthStateChanged(callback[, context])`](#onauthstatechangedcallback-context)
    * [`$signOut()`](#signout)
  * User Management
    * [`$createUserWithEmailAndPassword(email, password)`](#createuserwithemailandpasswordemail-password)
    * [`$updatePassword(password)`](#updatepasswordnewpassword)
    * [`$updateEmail(email)`](#updateemailnewemail)
    * [`$deleteUser()`](#deleteuser)
    * [`$sendPasswordResetEmail(email)`](#sendpasswordresetemailemail)
  * Router Helpers
    * [`$waitForSignIn()`](#waitforsignin)
    * [`$requireSignIn(requireEmailVerification)`](#requiresigninrequireemailverification)
* [`$firebaseStorage`](#firebasestorage)
  * [`$put(file, metadata)`](#putfile-metadata)
  * [`$putString(string, format, metadata)`](#putstringstring-format-metadata)
  * [`$getDownloadURL()`](#getdownloadurl)
  * [`$getMetadata()`](#getmetadata)
  * [`$updateMetadata(metadata)`](#updatemetadatametadata)
  * [`$delete()`](#delete)
  * [`$toString()`](#tostring)
  * [Upload Task](#upload-task)
    * [`$progress(callback)`](#progresscallback)
    * [`$complete(callback)`](#completecallback)
    * [`$error(callback)`](#errorcallback)
    * [`$cancel()`](#cancel)
    * [`$pause()`](#pause)
    * [`$snapshot()`](#snapshot)
    * [`then(callback)`](#then)
    * [`catch(callback)`](#catch)
* [Extending the Services](#extending-the-services)
  * [Extending `$firebaseObject`](#extending-firebaseobject)
  * [Extending `$firebaseArray`](#extending-firebasearray)
  * [Passing a Class into $extend](#passing-a-class-into-extend)
  * [Decorating the Services](#decorating-the-services)
  * [Creating AngularFire Services](#creating-angularfire-services)
* [SDK Compatibility](#sdk-compatibility)
* [Browser Compatibility](#browser-compatibility)


## Initialization

```js
var app = angular.module("app", ["firebase"]);
app.config(function() {
  var config = {
    apiKey: "<API_Key>",               // Your Firebase API key
    authDomain: "<AUTH_DOMAIN>",       // Your Firebase Auth domain ("*.firebaseapp.com")
    databaseURL: "<DATABASE_URL>",     // Your Firebase Database URL ("https://*.firebaseio.com")
    storageBucket: "<STORAGE_BUCKET>"  // Your Cloud Storage for Firebase bucket ("*.appspot.com")
  };
  firebase.initializeApp(config);
});
```


## $firebaseObject

The `$firebaseObject` service takes an optional [`firebase.database.Reference`](https://firebase.google.com/docs/reference/js/#firebase.database.Reference) or
[`firebase.database.Query`](https://firebase.google.com/docs/reference/js/#firebase.database.Query) and returns a JavaScript object which contains the data at the
provided location in Firebase and some extra AngularFire-specific fields. If no `Reference` or `Query` is provided, then the root of the Firebase Database will be used.
Note that the data will
not be available immediately since retrieving it is an asynchronous operation. You can use the
`$loaded()` promise to get notified when the data has loaded.

This service automatically keeps local objects in sync with any changes made to the remote Firebase database.
**However, note that any changes to that object will *not* automatically result in any changes
to the remote data**. All such changes will have to be performed by updating the object directly and
then calling `$save()` on the object, or by utilizing `$bindTo()` (see more below).

```js
app.controller("MyCtrl", ["$scope", "$firebaseObject",
  function($scope, $firebaseObject) {
     var ref = firebase.database().ref();

     var obj = $firebaseObject(ref);

     // to take an action after the data loads, use the $loaded() promise
     obj.$loaded().then(function() {
        console.log("loaded record:", obj.$id, obj.someOtherKeyInData);

       // To iterate the key/value pairs of the object, use angular.forEach()
       angular.forEach(obj, function(value, key) {
          console.log(key, value);
       });
     });

     // To make the data available in the DOM, assign it to $scope
     $scope.data = obj;

     // For three-way data bindings, bind it to the scope instead
     obj.$bindTo($scope, "data");
  }
]);
```

#### $id

The key where this record is stored. The same as `obj.$ref().key`.

#### $priority

The priority for this record according to the last update we received. Modifying this value
and then calling `$save()` will also update the server's priority.

**IMPORTANT NOTE**: Because Angular's `$watch()` function ignores keys prefixed with `$`, changing
this field inside the `$bindTo()` function will not trigger an update unless a field without a `$`
prefix is also updated. It is best to avoid using `$bindTo()` for editing `$` variables and just
rely on the `$save()` method.

#### $value

If the value in the database is a primitive (boolean, string, or number) then the value will
be stored under this `$value` key. Modifying this value and then calling `$save()` will also
update the server's value.

Note that any time other keys exist, this one will be ignored. To change an object to
a primitive value, delete the other keys and add this key to the object. As a shortcut, we can use:

```js
var obj = $firebaseObject(ref); // an object with data keys
$firebaseUtils.updateRec(obj, newPrimitiveValue); // updateRec will delete the other keys for us
```

**IMPORTANT NOTE**: Because Angular's `$watch()` function ignores keys prefixed with `$`, changing
this field inside the `$bindTo()` function will not trigger an update unless a field without a `$`
prefix is also updated. It is best to avoid using `$bindTo()` for editing `$` variables and just
rely on the `$save()` method.

### $remove()

Removes the entire object locally and from the database. This method returns a promise that will be
fulfilled when the data has been removed from the server. The promise will be resolved with a
`Firebase` reference for the exterminated record.

```js
var obj = $firebaseObject(ref);
obj.$remove().then(function(ref) {
  // data has been deleted locally and in the database
}, function(error) {
  console.log("Error:", error);
});
```

### $save()

If changes are made to data, then calling `$save()` will push those changes to the server. This
method returns a promise that will resolve with this object's `Firebase` reference when the write
is completed.

```js
var obj = $firebaseObject(ref);
obj.foo = "bar";
obj.$save().then(function(ref) {
  ref.key === obj.$id; // true
}, function(error) {
  console.log("Error:", error);
});
```

### $loaded()

Returns a promise which is resolved asynchronously when the initial object data has been downloaded
from the database. The promise resolves to the `$firebaseObject` itself.

```js
var obj = $firebaseObject(ref);
obj.$loaded()
  .then(function(data) {
    console.log(data === obj); // true
  })
  .catch(function(error) {
    console.error("Error:", error);
  });
```

As a shortcut, the `resolve()` / `reject()` methods can optionally be passed directly into `$loaded()`:

```js
var obj = $firebaseObject(ref);
obj.$loaded(
  function(data) {
    console.log(data === obj); // true
  },
  function(error) {
    console.error("Error:", error);
  }
);
```

### $ref()

Returns the `Firebase` reference used to create this object.

```js
var obj = $firebaseObject(ref);
obj.$ref() === ref; // true
```

### $bindTo(scope, varName)

Creates a three-way binding between a scope variable and the database data. When the `scope` data is
updated, changes are pushed to the database, and when changes occur in the database, they are pushed
instantly into `scope`. This method returns a promise that resolves after the initial value is
pulled from the database and set in the `scope` variable.

```js
var ref = firebase.database().ref(); // assume value here is { foo: "bar" }
var obj = $firebaseObject(ref);

obj.$bindTo($scope, "data").then(function() {
  console.log($scope.data); // { foo: "bar" }
  $scope.data.foo = "baz";  // will be saved to the database
  ref.set({ foo: "baz" });  // this would update the database and $scope.data
});
```

We can now bind to any property on our object directly in the HTML, and have it saved
instantly to the database. Security and Firebase Rules can be used for validation to ensure
data is formatted correctly at the server.

```html
<!--
  This input field has three-way data binding to the database
  (changing value updates remote data; remote changes are applied here)
-->
<input type="text" ng-model="data.foo" />
```

Only one scope variable can be bound at a time. If a second attempts to bind to the same
`$firebaseObject` instance, the promise will be rejected and the bind will fail.

**IMPORTANT NOTE**: Angular does not report variables prefixed with `$` to any `$watch()` listeners.
a simple workaround here is to use a variable prefixed with `_`, which will not be saved to the
server, but will trigger `$watch()`.

```js
var obj = $firebaseObject(ref);
obj.$bindTo($scope, "widget").then(function() {
  $scope.widget.$priority = 99;
  $scope.widget._updated = true;
})
```

If `$destroy()` is emitted by `scope` (this happens when a controller is destroyed), then this
object is automatically unbound from `scope`. It can also be manually unbound using the
`unbind()` method, which is passed into the promise callback.

```js
var obj = $firebaseObject(ref);
obj.$bindTo($scope, "data").then(function(unbind) {
  // unbind this later
  //unbind();
});
```

### $watch(callback, context)

Registers an event listener which will be notified any time there is a change to the data. Returns
an unregister function that, when invoked, will stop notifying the callback of changes.

```js
var obj = $firebaseObject(ref);
var unwatch = obj.$watch(function() {
  console.log("data changed!");
});

// at some time in the future, we can unregister using
unwatch();
```

### $destroy()

Calling this method cancels event listeners and frees memory used by this object (deletes the
local data). Changes are no longer synchronized to or from the database.

### $resolved

Attribute which represents the loaded state for this object. Its value will be `true` if the initial
object data has been downloaded from the database; otherwise, its value will be `false`. This
attribute is complementary to the `$loaded()` method. If the `$loaded()` promise is completed
(either with success or rejection), then `$resolved` will be `true`. `$resolved` will be
`false` before that.

Knowing if the object has been resolved is useful to conditionally show certain parts of your view:

```js
$scope.obj = $firebaseObject(ref);
```

```html
<!-- Loading state -->
<div ng-if="!obj.$resolved">
  ...
</div>

<!-- Loaded state -->
<div ng-if="obj.$resolved">
  ...
</div>
```


## $firebaseArray

The `$firebaseArray` service takes an optional [`firebase.database.Reference`](https://firebase.google.com/docs/reference/js/#firebase.database.Reference) or
[`firebase.database.Query`](https://firebase.google.com/docs/reference/js/#firebase.database.Query) and returns a JavaScript array which contains the data at the
provided location in Firebase and some extra AngularFire-specific fields. If no `Reference` or `Query` is provided, then the root of the Firebase Database will be used. Note that the data will not be available immediately since retrieving
it is an asynchronous operation. You can use the `$loaded()` promise to get notified when the data
has loaded.

This service automatically keeps this local array in sync with any changes made to the remote
database. This is a **PSEUDO READ-ONLY ARRAY** suitable for use in directives like `ng-repeat`
and with Angular filters (which expect an array).

While using read attributes and methods like `length` and `toString()` will work great on this array,
you should avoid directly manipulating the array. Methods like `splice()`, `push()`, `pop()`,
`shift()`, `unshift()`, and `reverse()` will cause the local data to become out of sync with the
server. Instead, utilize the `$add()`, `$remove()`, and `$save()` methods provided by the service to
change the structure of the array. To get the id of an item in a $firebaseArray within `ng-repeat`, call `$id` on that item.

``` js
// JavaScript
app.controller("MyCtrl", ["$scope", "$firebaseArray",
  function($scope, $firebaseArray) {
    var ref = firebase.database().ref();
    var list = $firebaseArray(ref);

    // add an item
    list.$add({ foo: "bar" }).then(...);

    // remove an item
    list.$remove(2).then(...);

    // make the list available in the DOM
    $scope.list = list;
  }
]);
```

``` html
<!-- HTML -->
<li ng-repeat="item in list | filter:name">{{ item | json }}</li>
```

The `$firebaseArray` service can also take a
[query](https://firebase.google.com/docs/database/web/retrieve-data) to only sync
a subset of data.

``` js
app.controller("MyCtrl", ["$scope", "$firebaseArray",
  function($scope, $firebaseArray) {
    var ref = firebase.database().ref();
    var messagesRef = ref.child("messages");
    var query = messagesRef.orderByChild("timestamp").limitToLast(10);

    var list = $firebaseArray(query);
  }
]);
```

Note that, while the array itself should not be modified, it is practical to change specific
elements of the array and save them back to the remote database:

```js
// JavaScript
var list = $firebaseArray(ref);
list[2].foo = "bar";
list.$save(2);
```

```html
<!-- HTML -->
<li ng-repeat="item in list">
  <input ng-model="item.foo" ng-change="list.$save(item)" />
</li>
```

### $add(newData)

Creates a new record in the database and adds the record to our local synchronized array.

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the `Firebase` reference for the newly added record, providing
easy access to its key.

```js
var list = $firebaseArray(ref);
list.$add({ foo: "bar" }).then(function(ref) {
  var id = ref.key;
  console.log("added record with id " + id);
  list.$indexFor(id); // returns location in the array
});
```

### $remove(recordOrIndex)

Remove a record from the database and from the local array. This method returns a promise that
resolves after the record is deleted at the server. It will contain a `Firebase` reference to
the deleted record. It accepts either an array index or a reference to an item that
exists in the array.

```js
var list = $firebaseArray(ref);
var item = list[2];
list.$remove(item).then(function(ref) {
  ref.key === item.$id; // true
});
```

### $save(recordOrIndex)

The array itself cannot be modified, but records in the array can be updated and saved back
to the database individually. This method saves an existing, modified local record back to the database.
It accepts either an array index or a reference to an item that exists in the array.

```js
$scope.list = $firebaseArray(ref);
```

```html
<li ng-repeat="item in list">
  <input type="text" ng-model="item.title" ng-change="list.$save(item)" />
</li>
```

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the `Firebase` reference for the saved record, providing easy
access to its key.

```js
var list = $firebaseArray(ref);
list[2].foo = "bar";
list.$save(2).then(function(ref) {
  ref.key === list[2].$id; // true
});
```

### $getRecord(key)

Returns the record from the array for the given key. If the key is not found, returns `null`.
This method utilizes `$indexFor(key)` to find the appropriate record.

```js
var list = $firebaseArray(ref);
var rec = list.$getRecord("foo"); // record with $id === "foo" or null
```

### $keyAt(recordOrIndex)

Returns the key for a record in the array. It accepts either an array index or
a reference to an item that exists in the array.

```js
// assume records "alpha", "bravo", and "charlie"
var list = $firebaseArray(ref);
list.$keyAt(1); // bravo
list.$keyAt( list[1] ); // bravo
```

### $indexFor(key)

The inverse of `$keyAt()`, this method takes a key and finds the associated record in the array.
If the record does not exist, -1 is returned.

```js
// assume records "alpha", "bravo", and "charlie"
var list = $firebaseArray(ref);
list.$indexFor("alpha"); // 0
list.$indexFor("bravo"); // 1
list.$indexFor("zulu"); // -1
```

### $loaded()

Returns a promise which is resolved asynchronously when the initial array data has been downloaded
from the database. The promise resolves to the `$firebaseArray`.

```js
var list = $firebaseArray(ref);
list.$loaded()
  .then(function(x) {
    x === list; // true
  })
  .catch(function(error) {
    console.log("Error:", error);
  });
```

The resolve/reject methods may also be passed directly into $loaded:

```js
var list = $firebaseArray(ref);
list.$loaded(
  function(x) {
    x === list; // true
  }, function(error) {
    console.error("Error:", error);
  });
```

### $ref()

Returns the `Firebase` reference used to create this array.

```js
var list = $firebaseArray(ref);
sync === list.$ref(); // true
```

### $watch(cb[, context])

Any callback passed here will be invoked each time data in the array is updated from the server.
The callback receives an object with the following keys:

 * `event`: The database event type which fired (`child_added`, `child_moved`, `child_removed`, or `child_changed`).
 * `key`: The ID of the record that triggered the event.
 * `prevChild`: If event is `child_added` or `child_moved`, this contains the previous record's key
   or `null` if `key` belongs to the first record in the collection.

```js
var list = $firebaseArray(ref);

list.$watch(function(event) {
  console.log(event);
});

// logs { event: "child_removed", key: "foo" }
list.$remove("foo");

// logs { event: "child_added", key: "<new_id>", prevId: "<prev_id>" }
list.$add({ hello: "world" });
```

A common use case for this would be to customize the sorting for a synchronized array. Since
each time an add or update arrives from the server, the data could become out of order, we
can re-sort on each event. We don't have to worry about excessive re-sorts slowing down Angular's
compile process, or creating excessive DOM updates, because the events are already batched
nicely into a single `$apply` event (we gather them up and trigger the events in batches before
telling `$digest` to dirty check).

```js
var list = $firebaseArray(ref);

// sort our list
list.sort(compare);

// each time the server sends records, re-sort
list.$watch(function() { list.sort(compare); });

// custom sorting routine (sort by last name)
function compare(a, b) {
  return a.lastName.localeCompare(b.lastName);
}
```

### $destroy()

Stop listening for events and free memory used by this array (empties the local copy).
Changes are no longer synchronized to or from the database.

### $resolved

Attribute which represents the loaded state for this array. Its value will be `true` if the initial
array data has been downloaded from the database; otherwise, its value will be `false`. This
attribute is complementary to the `$loaded()` method. If the `$loaded()` promise is completed
(either with success or rejection), then `$resolved` will be `true`. `$resolved` will be
`false` before that.

Knowing if the array has been resolved is useful to conditionally show certain parts of your view:

```js
$scope.list = $firebaseArray(ref);
```

```html
<!-- Loading state -->
<div ng-if="!list.$resolved">
  ...
</div>

<!-- Loaded state -->
<div ng-if="list.$resolved">
  ...
</div>
```


## $firebaseAuth

AngularFire includes support for [user authentication and management](/docs/guide/user-auth.md)
with the `$firebaseAuth` service.

The `$firebaseAuth` factory takes an optional Firebase auth instance (`firebase.auth()`) as its only
argument. Note that the authentication state is global to your application, even if multiple
`$firebaseAuth` objects are created unless you use multiple Firebase apps.

```js
app.controller("MyAuthCtrl", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {
    $scope.authObj = $firebaseAuth();
  }
]);
```

The authentication object returned by `$firebaseAuth` contains several methods for authenticating
users, responding to changes in authentication state, and managing user accounts for email /
password users.

### $signInWithCustomToken(authToken)

Authenticates the client using a [custom authentication token](https://firebase.google.com/docs/auth/web/custom-auth).
This function takes two arguments: an authentication token or a Firebase Secret and an object containing optional
client arguments, such as configuring session persistence.

```js
$scope.authObj.$signInWithCustomToken("<CUSTOM_AUTH_TOKEN>").then(function(firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

This method returns a promise which is resolved or rejected when the authentication attempt is
completed. If successful, the promise will be fulfilled with an object containing the payload of
the authentication token. If unsuccessful, the promise will be rejected with an `Error` object.

Read our [Custom Authentication guide](https://firebase.google.com/docs/auth/web/custom-auth)
for more details about generating your own custom authentication tokens.

### $signInAnonymously()

Authenticates the client using a new, temporary guest account.

```js
$scope.authObj.$signInAnonymously().then(function(firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

This method returns a promise which is resolved or rejected when the authentication attempt is
completed. If successful, the promise will be fulfilled with an object containing authentication
data about the signed-in user. If unsuccessful, the promise will be rejected with an `Error` object.

Read [our documentation on anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
for more details about anonymous authentication.

### $signInWithEmailAndPassword(email, password)

Authenticates the client using an email / password combination. This function takes two
arguments: an object containing `email` and `password` attributes corresponding to the user account
and an object containing optional client arguments, such as configuring session persistence.

```js
$scope.authObj.$signInWithEmailAndPassword("my@email.com", "password").then(function(firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

This method returns a promise which is resolved or rejected when the authentication attempt is
completed. If successful, the promise will be fulfilled with an object containing authentication
data about the signed-in user. If unsuccessful, the promise will be rejected with an `Error` object.

Read [our documentation on email / password authentication](https://firebase.google.com/docs/auth/web/password-auth)
for more details about email / password authentication.

### $signInWithPopup(provider)

Authenticates the client using a popup-based OAuth flow. This function takes a single argument: a
a string or provider object representing the OAuth provider to authenticate with. It returns a
promise which is resolved or rejected when the authentication attempt is completed. If successful,
the promise will be fulfilled with an object containing authentication data about the signed-in
user. If unsuccessful, the promise will be rejected with an `Error` object.

Valid values for the string version of the argument are `"facebook"`, `"github"`, `"google"`, and
`"twitter"`:

```js
$scope.authObj.$signInWithPopup("google").then(function(result) {
  console.log("Signed in as:", result.user.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

Alternatively, you can request certain scopes or custom parameters from the OAuth provider by
passing a provider object (such as `new firebase.auth.GoogleAuthProvider()`) configured with
additional options:

```js
var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/plus.login");
provider.setCustomParameters({
  login_hint: "user@example.com"
});

$scope.authObj.$signInWithPopup(provider).then(function(result) {
  console.log("Signed in as:", result.user.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

Firebase currently supports [Facebook](https://firebase.google.com/docs/auth/web/facebook-login),
[GitHub](https://firebase.google.com/docs/auth/web/github-auth),
[Google](https://firebase.google.com/docs/auth/web/google-signin),
and [Twitter](https://firebase.google.com/docs/auth/web/twitter-login) authentication. Refer to the
linked documentation in the previous sentence for information about configuring each provider.

### $signInWithRedirect(provider[, options])

Authenticates the client using a redirect-based OAuth flow. This function takes a single argument: a
string or provider object representing the OAuth provider to authenticate with. It returns a
rejected promise with an `Error` object if the authentication attempt fails. Upon successful
authentication, the browser will be redirected as part of the OAuth authentication flow. As such,
the returned promise will never be fulfilled. Instead, you should use the `$onAuthStateChanged()`
method to detect when the authentication has been successfully completed.

Valid values for the string version of the argument are `"facebook"`, `"github"`, `"google"`, and
`"twitter"`:

```js
$scope.authObj.$signInWithRedirect("google").then(function() {
  // Never called because of page redirect
  // Instead, use $onAuthStateChanged() to detect successful authentication
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

Alternatively, you can request certain scopes or custom parameters from the OAuth provider by
passing a provider object (such as `new firebase.auth.GoogleAuthProvider()`) configured with
additional options:

```js
var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/plus.login");
provider.setCustomParameters({
  login_hint: "user@example.com"
});

$scope.authObj.$signInWithRedirect(provider).then(function(result) {
  // Never called because of page redirect
  // Instead, use $onAuthStateChanged() to detect successful authentication
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

Firebase currently supports [Facebook](https://firebase.google.com/docs/auth/web/facebook-login),
[GitHub](https://firebase.google.com/docs/auth/web/github-auth),
[Google](https://firebase.google.com/docs/auth/web/google-signin),
and [Twitter](https://firebase.google.com/docs/auth/web/twitter-login) authentication. Refer to the
linked documentation in the previous sentence for information about configuring each provider.

### $signInWithCredential(credential)

Authenticates the client using a credential. This function takes a single argument: the credential
object. Credential objects are created from a provider-specific set of user data, such as their
email / password combination or an OAuth access token.

```js
// Email / password authentication with credential
var credential = firebase.auth.EmailAuthProvider.credential(email, password);

$scope.authObj.$signInWithCredential(credential).then(function(firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

```js
// Facebook authentication with credential
var credential = firebase.auth.FacebookAuthProvider.credential(
  // `event` come from the Facebook SDK's auth.authResponseChange() callback
  event.authResponse.accessToken
);

$scope.authObj.$signInWithCredential(credential).then(function(firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
}).catch(function(error) {
  console.error("Authentication failed:", error);
});
```

This method returns a promise which is resolved or rejected when the authentication attempt is
completed. If successful, the promise will be fulfilled with an object containing authentication
data about the signed-in user. If unsuccessful, the promise will be rejected with an `Error` object.

Firebase currently supports `$signInWithCredential()` for the
[email / password](https://firebase.google.com/docs/reference/node/firebase.auth.EmailAuthProvider#.credential),
[Facebook](https://firebase.google.com/docs/reference/node/firebase.auth.FacebookAuthProvider#.credential),
[GitHub](https://firebase.google.com/docs/reference/node/firebase.auth.GithubAuthProvider#.credential),
[Google](https://firebase.google.com/docs/reference/node/firebase.auth.GoogleAuthProvider#.credential),
and [Twitter](https://firebase.google.com/docs/reference/node/firebase.auth.TwitterAuthProvider#.credential)
authentication providers. Refer to the linked documentation in the previous sentence for information
about creating a credential for each provider.

### $getAuth()

Synchronously retrieves the current authentication state of the client. If the user is
authenticated, an object containing the fields `uid` (the unique user ID), `provider` (string
identifying the provider), `auth` (the authentication token payload), and `expires` (expiration
time in seconds since the Unix epoch) - and more, depending upon the provider used to authenticate -
will be returned. Otherwise, the return value will be `null`.

```js
var firebaseUser = $scope.authObj.$getAuth();

if (firebaseUser) {
  console.log("Signed in as:", firebaseUser.uid);
} else {
  console.log("Signed out");
}
```

### $onAuthStateChanged(callback[, context])

Listens for changes to the client's authentication state. The provided `callback` will fire when
the client's authenticate state changes. If authenticated, the callback will be passed an object
containing the fields `uid` (the unique user ID), `provider` (string identifying the provider),
`auth` (the authentication token payload), and `expires` (expiration time in seconds since the Unix
epoch) - and more, depending upon the provider used to authenticate. Otherwise, the callback will
be passed `null`.

```js
$scope.authObj.$onAuthStateChanged(function(firebaseUser) {
  if (firebaseUser) {
    console.log("Signed in as:", firebaseUser.uid);
  } else {
    console.log("Signed out");
  }
});
```

This method can also take an optional second argument which, if provided, will be used as `this`
when calling your callback.

This method returns a function which can be used to unregister the provided `callback`. Once the
`callback` is unregistered, changes in authentication state will not cause the `callback` to fire.

```js
var offAuth = $scope.authObj.$onAuthStateChanged(callback);

// ... sometime later, unregister the callback
offAuth();
```

### $signOut()

Signs out a client. It takes no arguments and returns an empty `Promise` when the client has been
signed out. Upon fulfillment, the `$onAuthStateChanged()` callback(s) will be triggered.

```html
<span ng-show="firebaseUser">
  {{ firebaseUser.displayName }} | <a href="#" ng-click="authObj.$signOut()">Sign out</a>
</span>
```

### $createUserWithEmailAndPassword(email, password)

Creates a new user account using an email / password combination. This function returns a promise
that is resolved with an object containing user data about the created user.

```js
$scope.authObj.$createUserWithEmailAndPassword("my@email.com", "mypassword")
  .then(function(firebaseUser) {
    console.log("User " + firebaseUser.uid + " created successfully!");
  }).catch(function(error) {
    console.error("Error: ", error);
  });
```

Note that this function both creates the new user and authenticates as the new user.

### $updatePassword(newPassword)

Changes the password of the currently signed-in user. This function returns a promise that is
resolved when the password has been successfully changed on the Firebase Authentication servers.

```js
$scope.authObj.$updatePassword("newPassword").then(function() {
  console.log("Password changed successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

### $updateEmail(newEmail)

Changes the email of the currently signed-in user. This function returns a promise that is resolved
when the email has been successfully changed on the Firebase Authentication servers.

```js
$scope.authObj.$updateEmail("new@email.com").then(function() {
  console.log("Email changed successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

### $deleteUser()

Deletes the currently authenticated user. This function returns a promise that is resolved when the
user has been successfully removed on the Firebase Authentication servers.

```js
$scope.authObj.$deleteUser().then(function() {
  console.log("User removed successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

Note that removing a user also logs that user out and will therefore fire any `onAuthStateChanged()`
callbacks that you have created.

### $sendPasswordResetEmail(email)

Sends a password-reset email to the owner of the account, containing a token that may be used to
authenticate and change the user's password. This function returns a promise that is resolved when
the email notification has been sent successfully.

```js
$scope.authObj.$sendPasswordResetEmail("my@email.com").then(function() {
  console.log("Password reset email sent successfully!");
}).catch(function(error) {
  console.error("Error: ", error);
});
```

### $waitForSignIn()

Helper method which returns a promise fulfilled with the current authentication state. This is
intended to be used in the `resolve()` method of Angular routers. See the
["Using Authentication with Routers"](/docs/guide/user-auth.md#authenticating-with-routers)
section of our AngularFire guide for more information and a full example.

### $requireSignIn(requireEmailVerification)

Helper method which returns a promise fulfilled with the current authentication state if the user
is authenticated and, if specified, has a verified email address, but otherwise rejects the promise.
This is intended to be used in the `resolve()` method of Angular routers to prevent unauthenticated
users from seeing authenticated pages momentarily during page load. See the
["Using Authentication with Routers"](/docs/guide/user-auth.md#authenticating-with-routers)
section of our AngularFire guide for more information and a full example.

## $firebaseStorage

AngularFire includes support for [binary storage](/docs/guide/uploading-downloading-binary-content.md)
with the `$firebaseStorage` service.

The `$firebaseStorage` service takes a [Storage](https://firebase.google.com/docs/storage/) reference.

```js
app.controller("MyCtrl", ["$scope", "$firebaseStorage",
  function($scope, $firebaseStorage) {
    var storageRef = firebase.storage().ref("images/dog");
    $scope.storage = $firebaseStorage(storageRef);
  }
]);
```

The storage object returned by `$firebaseStorage` contains several methods for uploading and
downloading binary content, as well as managing the content's metadata.

### $put(file, metadata)

[Uploads a `Blob` object](https://firebase.google.com/docs/storage/web/upload-files) to the specified storage reference's path with an optional metadata parameter.
Returns an [`UploadTask`](#upload-task) wrapped by AngularFire.


```js
var htmlFile = new Blob(["<html></html>"], { type : "text/html" });
var uploadTask = $scope.storage.$put(htmlFile, { contentType: "text/html" });
```

### $putString(string, format, metadata)

[Uploads a raw, `base64` string, or `base64url` string](https://firebase.google.com/docs/storage/web/upload-files#upload_from_a_string) to the specified storage reference's path with an optional metadata parameter.
Returns an [`UploadTask`](#upload-task) wrapped by AngularFire.

```js
var base64String = "5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB";
// Note: valid values for format are "raw", "base64", "base64url", and "data_url".
var uploadTask = $scope.storage.$putString(base64String, "base64", { contentType: "image/gif" });
```

### $getDownloadURL()

Returns a promise fulfilled with [the download URL](https://firebase.google.com/docs/storage/web/download-files#download_data_via_url) for the file stored at the configured path.

```js
$scope.storage.$getDownloadURL().then(function(url) {
  $scope.url = url;
});
```

### $getMetadata()

Returns a promise fulfilled with [the metadata of the file](https://firebase.google.com/docs/storage/web/file-metadata#get_file_metadata) stored at the configured path. File
metadata contains common properties such as `name`, `size`, and `contentType`
(often referred to as MIME type) in addition to some less common ones like `contentDisposition` and `timeCreated`.

```js
$scope.storage.$getMetadata().then(function(metadata) {
  $scope.metadata = metadata;
});
```

### $updateMetadata(metadata)

[Updates the metadata of the file](https://firebase.google.com/docs/storage/web/file-metadata#update_file_metadata) stored at the configured path.
Returns a promise fulfilled with the updated metadata.

```js
var updateData = { contenType: "text/plain" };
$scope.storage.$updateMetadata(updateData).then(function(updatedMetadata) {
  $scope.updatedMetadata = updatedMetadata;
});
```

### $delete()

Permanently [deletes the file stored](https://firebase.google.com/docs/storage/web/delete-files) at the configured path. Returns a promise that is resolved when the delete completes.

```js
$scope.storage.$delete().then(function() {
  console.log("successfully deleted!");
});
```

### $toString()

Returns a [string version of the bucket path](https://firebase.google.com/docs/reference/js/firebase.storage.Reference#toString) stored as a `gs://` scheme.

```js
// gs://<bucket>/<path>/<to>/<object>
var asString = $scope.storage.$toString();
```

### Upload Task

The [`$firebaseStorage()`](#firebasestorage) service returns an AngularFire wrapped [`UploadTask`](https://firebase.google.com/docs/reference/js/firebase.storage#uploadtask) when uploading binary content
using the [`$put()`](#putfile-metadata) and [`$putString()`](#putstringstring-format-metadata) methods. This task is used for [monitoring](https://firebase.google.com/docs/storage/web/upload-files#monitor_upload_progress)
and [managing](https://firebase.google.com/docs/storage/web/upload-files#manage_uploads) uploads.

```js
var htmlFile = new Blob(["<html></html>"], { type : "text/html" });
var uploadTask = $scope.storage.$put(htmlFile, { contentType: "text/html" });
```

#### $progress(callback)

Calls the provided callback function whenever there is an update in the progress of the file uploading. The callback
passes back an [`UploadTaskSnapshot`](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTaskSnapshot).

```js
var uploadTask = $scope.storage.$put(file);
uploadTask.$progress(function(snapshot) {
  var percentUploaded = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  console.log(percentUploaded);
});
```

#### $complete(callback)

Calls the provided callback function when the upload is complete. Passes back the completed [`UploadTaskSnapshot`](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTaskSnapshot).

```js
var uploadTask = $scope.storage.$put(file);
uploadTask.$complete(function(snapshot) {
  console.log(snapshot.downloadURL);
});
```

#### $error(callback)

Calls the provided callback function when there is an error uploading the file.

```js
var uploadTask = $scope.storage.$put(file);
uploadTask.$error(function(error) {
  console.error(error);
});
```

#### $cancel()

[Cancels](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask#cancel) the current upload.
Has no effect on a completed upload. Returns `true` if cancel had effect.

```js
var uploadTask = $scope.storage.$put(file);
var hadEffect = uploadTask.$cancel();
```

#### $pause()

[Pauses](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask#pause) the current upload.
Has no effect on a completed upload. Returns `true` if pause had effect.

```js
var uploadTask = $scope.storage.$put(file);
var hadEffect = uploadTask.$pause();
```

#### $snapshot()

Returns the [current immutable view of the task](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTaskSnapshot) at the time the event occurred.

```js
var uploadTask = $scope.storage.$put(file);
$scope.bytesTransferred = uploadTask.$snapshot.bytesTransferred;
```

#### then()
An `UploadTask` implements a promise like interface. The callback is called when the upload is complete. The callback
passes back an [UploadTaskSnapshot](https://firebase.google.com/docs/reference/js/firebase.storage.UploadTaskSnapshot).

```js
var uploadTask = $scope.storage.$put(file);
uploadTask.then(function(snapshot) {
  console.log(snapshot.downloadURL);
});
```

#### catch()
An `UploadTask` implements a promise like interface. The callback is called when an error occurs.

```js
var uploadTask = $scope.storage.$put(file);
uploadTask.catch(function(error) {
  console.error(error);
});
```

## Extending the Services

There are several powerful techniques for transforming the data downloaded and saved
by `$firebaseArray` and `$firebaseObject`. **These techniques should only be attempted
by advanced Angular users who know their way around the code.**

### Extending $firebaseObject

You can create a new factory from a `$firebaseObject`. It can add additional methods or override any existing method.

```js
var ColorFactory = $firebaseObject.$extend({
  getMyFavoriteColor: function() {
    return this.favoriteColor + ", no green!"; // obscure Monty Python reference
  }
});

var factory = new ColorFactory(ref);
var favColor = factory.getMyFavoriteColor();
```

This technique can also be used to transform how data is stored and saved by overriding the
following private methods:

 - **$$updated**: Called with a snapshot any time a `value` event is received from the database, must apply the updates and return true if any changes occurred.
 - **$$error**: Passed an `Error` any time a security error occurs. These are generally not recoverable.
 - **$$notify**: Sends notifications to any listeners registered with `$watch()`.
 - **toJSON**: As with any object, if a `toJSON()` method is provided, it will be used by `JSON.stringify()` to parse the JSON content before it is saved to the database.
 - **$$defaults**: A key / value pair that can be used to create default values for any fields which are not found in the server data (i.e. undefined fields). By default, they are applied each time `$$updated` is invoked. If that method is overridden, it would need to implement this behavior.

```js
// Add a counter to our object...
var FactoryWithCounter = $firebaseObject.$extend({
  // add a method to the prototype that returns our counter
  getUpdateCount: function() { return this._counter; },

  // each time an update arrives from the server, apply the change locally
  $$updated: function(snap) {
    // apply the changes using the super method
    var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

    // add / increment a counter each time there is an update
    if( !this._counter ) { this._counter = 0; }
    this._counter++;

    // return whether or not changes occurred
    return changed;
  }
});
```

### Extending $firebaseArray

You can create a new factory from a `$firebaseArray`. It can add additional methods or override any existing method.

```js
app.factory("ArrayWithSum", function($firebaseArray) {
  return $firebaseArray.$extend({
    sum: function() {
      var total = 0;
      angular.forEach(this.$list, function(rec) {
        total += rec.x;
      });
      return total;
    }
  });
})
```

We can then use this factory with by instantiating it:

```js
var list = new ArrayWithSum(ref);
list.$loaded().then(function() {
  console.log("List has " + list.sum() + " items");
});
```

This technique can be used to transform how data is stored by overriding the
following private methods:

 - **$$added**: Called with a snapshot and prevChild any time a `child_added` event occurs.
 - **$$updated**: Called with a snapshot any time a `child_changed` event occurs.
 - **$$moved**: Called with a snapshot and prevChild any time `child_moved` event occurs.
 - **$$removed**: Called with a snapshot any time a `child_removed` event occurs.
 - **$$error**: Passed an `Error` any time a security error occurs. These are generally not recoverable.
 - **$$getKey**: Tells AngularFire what the unique ID is for each record (the default just returns `this.$id`).
 - **$$notify**: Notifies any listeners registered with $watch; normally this method would not be modified.
 - **$$process**: Handles the actual splicing of data into and out of the array. Normally this method would not be modified.
 - **$$defaults**: A key / value pair that can be used to create default values for any fields which are not found in the server data (i.e. undefined fields). By default, they are applied each time `$$added` or `$$updated` are invoked. If those methods are overridden, they would need to implement this behavior.

To illustrate, let's create a factory that creates `Widget` instances, and transforms dates:

```js
// an object to return in our WidgetFactory
app.factory("Widget", function($firebaseUtils) {
  function Widget(snapshot) {
    // store the record id so AngularFire can identify it
    this.$id = snapshot.key;

    // apply the data
    this.update(snapshot);
  }

  Widget.prototype = {
    update: function(snapshot) {
      var oldData = angular.extend({}, this.data);

      // apply changes to this.data instead of directly on `this`
      this.data = snapshot.val();

      // add a parsed date to our widget
      this._date = new Date(this.data.date);

      // determine if anything changed, note that angular.equals will not check
      // $value or $priority (since it excludes anything that starts with $)
      // so be careful when using angular.equals()
      return !angular.equals(this.data, oldData);
    },

    getDate: function() {
      return this._date;
    },

    toJSON: function() {
      // since we changed where our data is stored, we need to tell AngularFire how
      // to get the JSON version of it. We can use $firebaseUtils.toJSON() to remove
      // private variables, copy the data into a shippable format, and do validation
      return $firebaseUtils.toJSON(this.data);
    }
  };

  return Widget;
});

// now let's create a synchronized array factory that uses our Widget
app.factory("WidgetFactory", function($firebaseArray, Widget) {
  return $firebaseArray.$extend({
    // change the added behavior to return Widget objects
    $$added: function(snap) {
      // instead of creating the default POJO (plain old JavaScript object)
      // we will return an instance of the Widget class each time a child_added
      // event is received from the server
      return new Widget(snap);
    },

    // override the update behavior to call Widget.update()
    $$updated: function(snap) {
      // we need to return true/false here or $watch listeners will not get triggered
      // luckily, our Widget.prototype.update() method already returns a boolean if
      // anything has changed
      return this.$getRecord(snap.key.update(snap);
    }
  });
});
```

### Passing a Class into $extend

Instead of just a list of functions, we can also pass in a class constructor to inherit methods from
`$firebaseArray`. The prototype for this class will be preserved, and it will inherit
from `$firebaseArray`.

**This is an extremely advanced feature. Do not use this unless you know that you need it**

This class constructor is expected to call `$firebaseArray`'s constructor (i.e. the super constructor).

The following factory adds an update counter which is incremented each time `$$added()`
or `$$updated()` is called:

```js
app.factory("ArrayWithCounter", function($firebaseArray, Widget) {
  // $firebaseArray and $firebaseObject constructors both accept a single argument, a `Firebase` ref
  function ArrayWithCounter(ref) {
    // initialize a counter
    this.counter = 0;

    // call the super constructor
    return $firebaseArray.call(this, ref);
  }

  // override the add behavior to return a Widget
  ArrayWithCounter.prototype.$$added = function(snap) {
    return new Widget(snap);
  };

  // override the update behavior to call Widget.update()
  ArrayWithCounter.prototype.$$updated = function(snap) {
    var widget = this.$getRecord(snap.key;
    return widget.update();
  };

  // pass our constructor to $extend, which will automatically extract the
  // prototype methods and call the constructor appropriately
  return $firebaseArray.$extend(ArrayWithCounter);
});
```

### Decorating the Services

In general, it will be more useful to extend the services to create new services than
to use this technique. However, it is also possible to modify `$firebaseArray` or
`$firebaseObject` globally by using Angular's `$decorate()` method.

```js
app.config(function($provide) {
  $provide.decorator("$firebaseObject", function($delegate, $firebaseUtils) {
    var _super = $delegate.prototype.$$updated;

    // override any instance of $firebaseObject to look for a date field
    // and transforms it to a Date object.
    $delegate.prototype.$$updated = function(snap) {
      var changed = _super.call(this, snap);
      if( this.hasOwnProperty("date") ) {
        this._dateObj = new Date(this.date);
      }
      return changed;
    };

    // add a method that fetches the date object we just created
    $delegate.prototype.getDate = function() {
      return this._dateObj;
    };

    // variables starting with _ are ignored by AngularFire so we don't need
    // to worry about the toJSON method here

    return $delegate;
  });
});
```

### Creating AngularFire Services

With the ability to extend the AngularFire services, services can be built to represent
our synchronized collections with a minimal amount of code. For example, we can create
a `User` factory:

```js
// create a User factory with a getFullName() method
app.factory("UserFactory", function($firebaseObject) {
  return $firebaseObject.$extend({
      getFullName: function() {
        // concatenate first and last name
        return this.first_name + " " + this.last_name;
      }
   });
});
```

And create a new instance:

```js
// create a User object from our Factory
app.factory("User", function(UserFactory) {
  var ref = firebase.database().ref();
  var usersRef = ref.child("users");
  return function(userid) {
    return new UserFactory(usersRef.child(userid));
  }
});
```

Similarly, we can extend `$firebaseArray` by creating a `Message` object:

```js
app.factory("Message", function($firebaseArray) {
  function Message(snap) {
    // store the user ID so AngularFire can identify the records
    // in this case, we store it in a custom location, so we'll need
    // to override $$getKey
    this.message_id = snap.key;
    this.message = snap.val();
  }
  Message.prototype = {
    update: function(snap) {
      // store a string into this.message (instead of the default $value)
      if( snap.val() !== this.message ) {
        this.message = snap.val();
        return true;
      }
      return false;
    },
    toJSON: function() {
      // tell AngularFire what data to save, in this case a string
      return this.message;
    }
  };

  return Message;
});
```

We can then use that to extend the `$firebaseArray` factory:

```js
app.factory("MessageFactory", function($firebaseArray, Message) {
  return $firebaseArray.$extend({
    // override the $createObject behavior to return a Message object
    $$added: function(snap) {
      return new Message(snap);
    },

    // override the $$updated behavior to call a method on the Message
    $$updated: function(snap) {
      var msg = this.$getRecord(snap.key);
      return msg.update(snap);
    },

    // our messages store the unique id in a special location, so tell $firebaseArray
    // how to find the id for each record
    $$getKey: function(rec) {
      return rec.message_id;
    }
  });
});
```

And finally, we can put it all together into a synchronized list of messages:

```js
app.factory("MessageList", function(MessageFactory) {
  return function(ref) {
    return new MessageFactory(ref);
  }
});
```


## SDK Compatibility

This documentation is for AngularFire 2.x.x with Firebase SDK 3.x.x.

| SDK Version | AngularFire Version Supported |
|-------------|-------------------------------|
| 3.x.x | 2.x.x |
| 2.x.x | 1.x.x |


## Browser Compatibility

<table>
  <tr>
    <th>Browser</th>
    <th>Version Supported</th>
    <th>With Polyfill</th>
  </tr>
  <tr>
    <td>Internet Explorer</td>
    <td>9+</td>
    <td>9+ (Angular 1.3 only supports 9+)</td>
  </tr>
  <tr>
    <td>Firefox</td>
    <td>4.0</td>
    <td>3.0?</td>
  </tr>
  <tr>
    <td>Chrome</td>
    <td>7</td>
    <td>5?</td>
  </tr>
  <tr>
    <td>Safari</td>
    <td>5.1.4</td>
    <td>?</td>
  </tr>
  <tr>
    <td>Opera</td>
    <td>11.6</td>
    <td>?</td>
  </tr>
</table>

Polyfills are automatically included to support older browsers. See `src/polyfills.js` for links
and details.
