AngularFire
===========
AngularFire is the officially supported AngularJS binding for Firebase. This binding lets you associate
Firebase URLs with Angular models so that
they will be transparently and immediately kept in sync with the Firebase
servers and with all other clients currently using your app.


Getting Started
---------------
Using AngularFire is as simple as including two JavaScript files, one for
Firebase and another for AngularFire, in your HTML file. Note that they're both
served from Firebase's CDN, which you are welcome to use.

``` html
<script src="https://cdn.firebase.com/v0/firebase.js"></script>
<script src="https://cdn.firebase.com/libs/angularfire/0.6.0/angularfire.js"></script>
```

Next, add the Firebase module as a dependency for your Angular app.

``` js
var myapp = angular.module("myapp", ["firebase"]);
```

$firebase
---------
You now have access to the `$firebase` service. You can specify it as a
dependency in your controllers and services.

``` js
myapp.controller("MyController", ["$scope", "$firebase",
  function($scope, $firebase) {}
]);
```

### Constructor

The `$firebase` service takes a single argument: a Firebase reference. Note that you
may apply queries and limits on it if you want to only sync a subset of your data.

The object returned by `$firebase` will automatically be kept in sync with
the remote Firebase data. **Note that any changes to that object will *not*
automatically result in any changes to the remote data**. All such changes will
have to performed via one of the methods prefixed with "$" available on this
object.

The service *always* returns an object (it will never be an array or primitive).
If the Firebase reference points to a primitive value, it will be wrapped in
an object with a key named `$value` containing the primitive value. If the
reference pointed to an array, you'll get an object with the array indices as
keys. If you'd like a native array ordered by priority instead, please take a
look at the [orderByPriority](#orderbypriority) filter.

``` js
myapp.controller("MyController", ["$scope", "$firebase",
  function($scope, $firebase) {
    $scope.items = $firebase(new Firebase(URL));
  }
]);
```

### $add(value)

The `$add` method takes a single argument of any type. It will append this
value as a member of a list (ordered in chronological order). This is the
equivalent of calling `push(value)` on a Firebase reference.

``` js
$scope.items.$add({foo: "bar"});
```

### $remove([key])

The `$remove` method takes a single optional argument, a key. If a key is
provided, this method will remove the child referenced by that key. If no
key is provided, the entire object will be removed remotely.

``` js
$scope.items.$remove("foo"); // Removes child named "foo".
$scope.items.$remove();      // Removes the entire object.
```

### $save([key])

The `$save` method takes a single optional argument, a key. If a key is
provided, this method will save all changes made to the child element
referenced by that key to Firebase. If no key is provided, all local changes
made to this object will be persisted to Firebase. This operation is commonly
used to save any local changes made to the model.

``` js
$scope.items.foo = "baz";
$scope.items.$save("foo");  // new Firebase(URL + "/foo") now contains "baz".
```

### $child(key)

Creates a new `$firebase` object for a child referenced by the provided key.

``` js
var child = $scope.items.$child("foo");
child.$remove();            // Same as calling $scope.items.$remove("foo");
```

### $set(value)

Overwrites the remote value for this object to `newValue`. The local object
will also be subsequently updated to this new value.

``` js
$scope.items.$set({bar: "baz"});  // new Firebase(URL + "/foo") is now null.
```

### $transaction(updateFn, [applyLocally])

Used to atomically modify data at the Firebase location. $transaction is used to modify the
existing value to a new value, ensuring there are no conflicts with other clients writing
to the same location at the same time. See [Firebase docs](https://www.firebase.com/docs/javascript/firebase/transaction.html)
for more details. 

$transaction takes an `updateFn` argument which is a developer-supplied function
that will be passed the current data stored at the location (as a JS object). The function should
return the new value it would like written (as a JS object). If `undefined` is returned, the transaction
will be aborted and the data at the location will not be modified.

By default, events are raised each time the transaction update function runs. So if it is run
multiple times, you may see intermediate states. You can set the `applyLocally` argument to false
to suppress these intermediate states and instead wait until the transaction has complted before
events are raised.

$transaction returns a promise which will resolve to null if the transaction is aborted, otherwise
it resolves with the snapshot of the new data at the location.

``` js
$scope.messageCount = $firebase(new Firebase(URL + "/messageCount"));
// Increment the message count by 1
$scope.messageCount.$transaction(function(currentCount) {
	if(!currentCount) { return 1; }
	if(currentCount < 0) { return; } 	// return undefined to abort transaction
	return currentCount + 1;			// increment the count by 1
}).then(function(snapshot) {
	if(!snapshot) {
		// handle aborted transaction
	} else {
		// do something
	}
}, function(err) {
	// handle the error condition
});
```

### $getIndex()

Returns an ordered list of keys in the data object, sorted by their Firebase priorities.
If you're looking for a quick way to convert the items to a sorted array for use in tools
 like `ng-repeat`, see the [orderByPriority](#orderbypriority) filter.

 ``` js
 var keys = $scope.items.$getIndex();
 keys.forEach(function(key, i) {
    console.log(i, $scope.items[key]); // prints items in order they appear in Firebase
 });
 ```

Priorities
----------
The Firebase priority of an object is provided (if available) as the
`$priority` field. Changing its value, and calling `$save` will also result
in the priority value being persisted in Firebase.

``` js
$scope.items.foo.$priority = 20;
$scope.items.$save("foo");  // new Firebase(URL + "foo")'s priority is now 20.
```

Events
------
You can call the `$on` method on the object returned by `$firebase` to attach
event handlers.

### $on(eventName, handler)

Adds an event handler for the specified event. You can attach events for
regular Firebase events (such as `child_added` and `value`, see the
[Firebase docs](https://www.firebase.com/docs/javascript/query/on.html) for a
full list), and two additional ones:

``` js
$scope.items.$on("loaded", function() {
  console.log("Initial data received!");
});
$scope.items.$on("change", function() {
  console.log("A remote change was applied locally!");
});
```

* `loaded`: The event is triggered exactly once, when the initial data
is received from Firebase.
* `change`: This event is triggered every time there is a remote change
in the data which was applied to the local object.

### $off([eventName], [handler])

Detaches a parituclar event handler. If no handler is specified, all callbacks
for the specified event type will be detached. If no event type is specified,
synchronization will be turned off for this entire `$firebase` instance.

```js
// Detaches all `loaded` event handlers.
$scope.items.$off('loaded');
// Stops synchronization on `$scope.items` completely.
function stopSync() {
  $scope.items.$off();
}
```

3-Way Data Binding
------------------
You can call the `$bind` method on the object returned by `$firebase` to
establish an automatic 3-way data binding.

### $bind($scope, model)

Creates an implicit, 3-way data binding between the Firebase data, an
ng-model and the DOM. Calling this method will automatically synchronize *all*
changes made to the local model with Firebase. Once a 3-way binding has been
established, you no longer need to explicitely save data to Firebase (for
example, by using `$add` or `$save`).

``` js
$scope.items.$bind($scope, "remoteItems");
$scope.remoteItems.bar = "foo";  // new Firebase(URL + "/bar") is now "foo".
```

This method returns a promise, which will be resolved when the initial data
from the server has been received. The promise will be resolved with an
`unbind` function, which, when called, will disassociate the 3-way binding.

``` js
$scope.items.$bind($scope, "remote").then(function(unbind) {
  unbind();
  $scope.remote.bar = "foo";    // No changes have been made to the remote data.
});
```

Ordered Data and Arrays
-----------------------
Since `$firebase` always returns a JavaScript object, you may want to convert
it to an array using the `orderByPriority` filter if the order of items is
important to you.

### orderByPriority

The `orderByPriority` filter is provided by AngularFire to convert an object
returned by `$firebase` into an array. The objects in the array are ordered
by priority (as defined in Firebase). Additionally, each object in the array
will have a `$id` property defined on it, which will correspond to the key name
for that object.

``` html
<ul ng-repeat="item in items | orderByPriority">
  <li>
    <input type="text" id="{{item.$id}}" ng-model="item.$priority"/>
    {{item.name}}
  </li>
</ul>
```

$firebaseSimpleLogin
-------------
AngularFire includes support for user authentication via
[Firebase Simple Login](https://www.firebase.com/docs/security/simple-login-overview.html) with the
$firebaseSimpleLogin service. You'll need to include `firebase` as a dependency of your app's module to
use this service.

Note that Firebase also provides a low-level, extremely flexible authentication system called
[Custom Login](https://www.firebase.com/docs/security/custom-login.html) for developers with complex use cases.
Simple Login is intended to handle the common use cases that most
applications encounter with a drop-in, hosted solution.


### Login Service Constructor

The `$firebaseSimpleLogin` factory takes a Firebase reference (not a $firebase object) as its only argument.
Note that the login state for Simple Login is global to your application, even if multiple $firebaseSimpleLogin objects
are created.

``` js
myapp.controller("MyAuthController", ["$scope", "$firebaseSimpleLogin",
  function($scope, $firebaseSimpleLogin) {
    var dataRef = new Firebase("https://myapp.firebaseio.com");
    $scope.loginObj = $firebaseSimpleLogin(dataRef);
  }
]);
```

The login object returned by `$firebaseSimpleLogin` contains a single property named `user`.
This property will be set to `null` if the user is logged out and will change
to an object containing the user's details once they are logged in.

The contents of the `user` object vary depending on the authentication
mechanism used, but will, at a minimum, contain the `id` and `provider`
properties. Please refer to the
[Firebase Simple Login](https://www.firebase.com/docs/security/simple-login-overview.html)
documentation for additional properties (such as `name`) that may be available.

In addition, this login object has several functions for managing your login state, as listed below.

### $getCurrentUser()

The `$getCurrentUser` function returns a future that will be resolved with the user info for the currently
logged-in user. Note that the user info will be null if no user is logged in.


### $login(provider, [options])

The `$login` method should be called when you want to log a user into your app.
Typically, this is in response to the user clicking a login button. This
function takes two arguments: a provider specifying how to authenticate the user, and a set of options
that control behavior for certain providers.

``` js
$scope.loginObj.$login('password', {
   email: 'my@email.com',
   password: 'mypassword'
}).then(function(user) {
   console.log('Logged in as: ', user.uid);
}, function(error) {
   console.error('Login failed: ', error);
});
```

Note that the `login object` can be included in your scope, and the methods on it can be called directly from your
HTML as shown:

``` html
<a href="#" ng-hide="loginObj.user" ng-click="loginObj.$login('twitter')">Login</a>
```

Firebase Simple Login provides both username and password authentication and authentication
using common third party providers such as Twitter, Facebook, Persona, and Github. For a complete
list of providers and options, read
the [Simple Login docs](https://www.firebase.com/docs/security/simple-login-overview.html).

The `$login` method returns a promise which is resolved or rejected when the authentication
attempt is completed. The success callback receives a user object containing information about the
newly logged-in user, and the error callback receives an Error object.


### $logout()

The `$logout` method should be called when you want to
log out the current user. It takes no arguments and returns no value. When logout is called, the
`$firebaseSimpleLogin:logout` event will be fired,
and the `user` property on the object will be set to `null`.

``` html
<span ng-show="loginObj.user">
  {{loginObj.user.name}} | <a href="#" ng-click="loginObj.$logout()">Logout</a>
</span>
```

### $createUser(email, password, [noLogin])

The `$createUser` method is useful if you are using the "password" provider from Firebase Simple Login
that allows you to manage your own set of user accounts where users authenticate with an email address and password.
This function creates a new user account with the specified email address and password. Set the optional
`noLogin` parameter to true to tell AngularFire not to automatically
log into the new user account after it has been created.

This function returns a promise that is resolved when the user account has been successfully created.


### $changePassword(email, oldPassword, newPassword)

The `$changePassword` function changes the password for the user account with the specified email address. This function
returns a promise that is resolved when the password has been successfully changed on the Firebase servers.


### $removeUser(email, password)

The `$removeUser` function deletes the user account for the specified email address. This function returns a promise
that is resolved when the user has been successfully removed on the Firebase servers.


### $sendPasswordResetEmail(email)

The `$sendPasswordResetEmail` function sends a password reset email to the specified email address, containing a new,
temporary password that the user may use to log in and update their credentials. This function returns a promise
that is resolved when the email notification has been sent successfully.


### Login-related Events

The following events will be broadcast on `$rootScope` as a result of AngularFire login activity.

  * `$firebaseSimpleLogin:login`: Fired when a user successfully logs in. In addition
to the event object, the event callback will be passed one argument: the user object.
  * `$firebaseSimpleLogin:logout`: Fired when a user logs out. No arguments except the event object will be
passed to the event callback.
  * `$firebaseSimpleLogin:error`: Fired when an error has occurred. In addition
to the event object, the event callback will be passed one argument, the error.

An example:

``` js
$rootScope.$on("$firebaseSimpleLogin:login", function(e, user) {
  console.log("User " + user.id + " successfully logged in!");
});
```