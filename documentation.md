AngularFire
===========
AngularFire is an officially supported AngularJS binding for Firebase.

The bindings let you associate a Firebase URL with a model (or set of models),
and they will be transparently kept in sync across all clients currently using
your app. The 2-way data binding offered by AngularJS works as normal, except
that the changes are also sent to all other clients instead of just a server.

Getting Started
---------------
Using AngularFire is as simple as including two JavaScript files, one for
Firebase, and another for AngularFire in your HTML file. They're both
served off of Firebase's CDN, which you are welcome to use!

``` html
<script src="https://cdn.firebase.com/v0/firebase.js"></script>
<script src="https://cdn.firebase.com/libs/angularfire/0.5.0/angularfire.js"></script>
```

Next, add the Firebase module as a depedency for your Angular app.

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

The `$firebase` service takes a single argument: a Firebase reference. You
may apply queries and limits on it if required.

The object returned by `$firebase` will automatically be kept in sync with
the remote Firebase data. **Note that any changes to that object will *not*
result in any changes being made to the remote data**. All such changes will
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

Adds an event handler for the specified event. Currently, there are two types
of events you can associate handlers with.

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

$firebaseAuth
-------------
AngularFire includes support for user authentication via the Firebase
[Simple Login](https://www.firebase.com/docs/security/simple-login-overview.html)
and [Custom Login](https://www.firebase.com/docs/security/custom-login.html)
methods. This is provided via the `$firebaseAuth` service, which is available
in your controllers and services once you've defined `firebase` as a dependency
in your app's module.

``` js
myapp.controller("MyAuthController", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {}
]);
```

### Auth Constructor

The `$firebaseAuth` factory takes two arguments: a Firebase reference, and
an optional object with options. The object may contain the following
properties:

  * `path`: The path to which the user will be redirected if the `authRequired`
property was set to `true` in the `$routeProvider`, and the user isn't
logged in.
  * `simple`: `$firebaseAuth` requires inclusion of the
`firebase-simple-login.js` file by default. If this value is set to false, this
requirement is waived, but only custom login functionality will be enabled.
  * `callback`: A function that will be called when there is a change in
authentication state. This is an alternative to events fired on `$rootScope`,
which is the recommended way to handle changes in auth state.

The object returned by `$firebaseAuth` contains a single property, named `user`.
This property will be set to `null` if the user is logged out and will change
to an object containing the user's details once they are logged in.

The contents of the `user` object vary depending on the authentication
mechanism used, but will, at a minimum contain the `id` and `provider`
properties. Please refer to the
[Firebase Simple Login](https://www.firebase.com/docs/security/simple-login-overview.html)
documentation for additional properties (such as `name`) that may be available.

``` js
myapp.controller("MyAuthController", ["$scope", "$firebaseAuth",
  function($scope, $firebaseAuth) {
    var ref = new Firebase(URL);
    $scope.auth = $firebaseAuth(ref);
    // $scope.auth.user will be `null` until the user logs in.
  }
]);
```

### Auth Events

The following events will be broadcasted on the `$rootScope`. Authentication
state is global, it is not possible to be logged in as a different user in
each controller (unless you log out and log back in manually, of course).

``` js
$rootScope.$on("$firebaseAuth:login", function(e, user) {
  console.log("User " + user.id + " successfully logged in!");
});
```

  * `$firebaseAuth:login`: Fired when a user successfully logs in. Will be
passed a single argument, the user object.
  * `$firebaseAuth:logout`: Fired when a user logs out. No arguments are
passed.
  * `$firebaseAuth:error`: Fired when there was error during logging in or out.
Will be passed a single argument, the error.

### $login(token, [options])

The `$login` method should be called when you want to login in a user.
Typically, this is in response to the user clicking a login button. This
function takes two arguments:

``` html
<a href="#" ng-hide="auth.user" ng-click="auth.$login('persona')">Login</a>
```

  * `tokenOrProvider`: If you're using Firebase Simple Login, simply pass in a
provider name, such as 'facebook' or 'persona'. If you're using Custom Login,
pass in a valid JWT token.
  * `options`: This is useful for Simple Login only, where the provided options
will be passed as-is to the Simple Login method. For a "password" provider,
for example, you will want to provide the username and password as an object.

The `$login` method returns a promise which is resolved or rejected when the authentication
attempt is completed. The success callback receives the user object and the error callback receives
an Error object.

``` js
auth.$login('persona').then(function(user) {
   console.log('Logged in as: ', user.uid);
}, function(error) {
   console.error('Login failed: ', error);
});
```

### $logout()

The `$logout` method should be called (with no arguments) when you want to
log out the current user. The `$firebaseAuth:logout` event will be fired,
and the `user` property will be set to `null` after the logout is completed.

``` html
<span ng-show="auth.user">
  {{auth.user.name}} | <a href="#" ng-click="auth.$logout()">Logout</a>
</span>
```

### $createUser()

The `$createUser` method is useful if you are using the "password" provider
with Firebase Simple Login. It takes the same arguments as the `createUser()`
method provided by Simple Login, see the documentation for the
[Email / Password provider](https://www.firebase.com/docs/security/simple-login-email-password.html)
for more info.
