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
<script src="https://cdn.firebase.com/js/client/1.0.6/firebase.js"></script>
<script src="https://cdn.firebase.com/libs/angularfire/0.7.1/angularfire.js"></script>
```

If you want to use any Simple Login related functionality, you'll need to include
the appropriate version of the Simple Login library as well.

``` html
<script src="https://cdn.firebase.com/js/simple-login/1.3.0/firebase-simple-login.js"></script>
```

Certain versions of AngularFire require certain versions of the Firebase and
Simple Login libraries. The following table documents the version dependencies:

<table>
  <tr>
    <th>AngularFire Version</th>
    <th>Firebase Version</th>
    <th>Simple Login Version</th>
    <th>Angular Version</th>
  </tr>
  <tr>
    <td>0.3.0 - 0.5.0</td>
    <td>v0</td>
    <td>v0</td>
    <td>1.1.2+</td>
  </tr>
  <tr>
    <td>0.6.0</td>
    <td>1.0.2</td>
    <td>1.2.3</td>
    <td>1.1.2+</td>
  </tr>
  <tr>
    <td>0.7.0</td>
    <td>1.0.5</td>
    <td>1.2.5</td>
    <td>1.2+</td>
  </tr>
  <tr>
    <td>0.7.1</td>
    <td>1.0.6</td>
    <td>1.3.0</td>
    <td>1.2+</td>
  </tr>
</table>

Next, add the Firebase module as a dependency for your Angular app.

``` js
var myapp = angular.module("myapp", ["firebase"]);
```

You now have access to the `$firebase` service. You can specify it as a
dependency in your controllers and services.

``` js
myapp.controller("MyController", ["$firebase",
   function($firebase) {}
]);
```

$firebase
---------

The `$firebase` object is a special collection. It contains all the child records as keys and also
some helper methods that begin with `$`. For example:

```js
// assuming data: { "a": {foo: "bar", counter: 1}, "b": {hello: "world", counter: 2} }
myapp.controller("MyController", function($firebase) {
   var ref = new Firebase(URL);
   var data = $firebase(ref);

});

```

### Constructor

The `$firebase` service takes a single argument: a Firebase reference. Note that you
may apply queries and limits on it if you want to only sync a subset of your data.

The object returned by `$firebase` will automatically be kept in sync with
the remote Firebase data. **Note that any changes to that object will *not*
automatically result in any changes to the remote data**. All such changes will
have to performed via one of the methods prefixed with "$" available on this
object.

The service **always** returns an object (it will never be an array or primitive).
If the Firebase reference points to a primitive value, it will be wrapped in
an object with a key named `$value` containing the primitive value.

``` js
myapp.controller("MyController", ["$firebase",
  function($firebase) {
     items = $firebase(new Firebase(URL));

     items.$on('loaded', function() {
        console.log('retrieved data from server!');
     });
  }
]);
```

To access the data from the DOM or in directives like `ng-repeat`, place it in `scope` and
use the [$asArray](#asArray) method to convert it to an array for filtering and sorting:

``` js
myapp.controller("MyController", ["$firebase",
  function($firebase) {
     var ref = $firebase(new Firebase(URL));
     $scope.items = ref.$asArray($scope);
  }
]);
```

``` html
<li ng-repeat="item in items | filter:name">{{item|json}}</li>
```

Instead of converting data to an array, you can also iterate objects directly
using ng-repeat:

``` html
<li ng-repeat="(key,value) in object">{{key}}: {{value}}</li>
```

### $add(value)

The `$add` method takes a single argument of any type. It will append this
value as a member of a list (ordered in chronological order). This is the
equivalent of calling `push(value)` on a Firebase reference.

``` js
items.$add({foo: "bar"});
```

This method returns a promise that will be fulfilled when the data has
been saved to the server. The promise will be resolved with a Firebase
reference, from which you can extract the key name of the newly added data.

``` js
items.$add({baz: "boo"}).then(function(ref) {
  ref.name();                // Key name of the added data.
});
```

### $remove([key])

The `$remove` method takes a single optional argument, a key. If a key is
provided, this method will remove the child referenced by that key. If no
key is provided, the entire object will be removed remotely.

```js
items.$remove("foo"); // Removes child named "foo".
items.$remove();      // Removes the entire object.
```

This method returns a promise which will be resolved when the data has
been successfully deleted from the server.

### $save([key])

The `$save` method takes a single optional argument, a key. If a key is
provided, this method will save all changes made to the child element
referenced by that key to Firebase. If no key is provided, all local changes
made to this object will be persisted to Firebase. This operation is commonly
used to save any local changes made to the model.

```js
items.foo = "baz";
items.$save("foo");  // new Firebase(URL + "/foo") now contains "baz".
```

This method returns a promise which will be resolved when the data has been
successfully saved on the server.

### $set(value)

Overwrites the remote value for this object to `newValue`. The local object
will also be subsequently updated to this new value.

``` js
items.$set({bar: "baz"});  // new Firebase(URL + "/foo") is now null.
```

This method returns a promise which will be resolved when the data has been
successfully saved on the server.

### $update(value)

Non-destructively update the Firebase location with the provided keys and values.
The keys specified in `value` will be updated, but all other values will
remain untouched. This is the equivalent of calling `update(value)` on a Firebase reference.

``` js
items.$set({foo: "bar", baz: "boo"});
items.$update({baz: "fizz"});  // The data is now {foo: "bar", baz: "fizz"}.
```

This method returns a promise which will be resolved when the data has been
successfully saved on the server.

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

This method returns a promise which will resolve to null if the transaction is aborted, otherwise
it resolves with the snapshot of the new data at the location.

``` js
$scope.messageCount = $firebase(new Firebase(URL + "/messageCount"));

// Increment the message count by 1
$scope.messageCount.$transaction(function(currentCount) {
	if (!currentCount) return 1;   // Initial value for counter.
	if (currentCount < 0) return;  // Return undefined to abort transaction.
	return currentCount + 1;			 // Increment the count by 1.
}).then(function(snapshot) {
	if (!snapshot) {
		// Handle aborted transaction.
	} else {
		// Do something.
	}
}, function(err) {
	// Handle the error condition.
});
```

### $getRef()

Returns the Firebase reference used internally by this object. This can be useful to perform more
advanced/specialized operations that the `$firebase` object isn't suited for, and to access API methods
which are not available on `$firebase`.

### $keys()

Returns an ordered list of keys in the data object, sorted by their Firebase priorities.
If you're looking for a quick way to convert the items to a sorted array for use in tools
like `ng-repeat`, see [$asArray](#asArray).

``` js
var keys = items.$keys();
keys.forEach(function(key, i) {
  console.log(i, items[key]); // Prints items in order they appear in Firebase.
});
```

### $id

Returns the firebase path name (i.e. key) for the reference. This will also exist
 on each child record assuming it is not a primitive.

``` js
var ref = new Firebase('https://INSTANCE.firebaseio.com/widgets');
var items = $firebase(ref);

console.log(items.$id); // widgets
angular.forEach(items, function(obj, key) {
   console.log(obj.$id === key); // true!
});
```

### $priority

The Firebase priority of an object is provided (if available) as the
`$priority` field. Changing its value, and calling `$save` will also result
in the priority value being persisted in Firebase.

``` js
items.foo.$priority = 20;
items.$save("foo");  // new Firebase(URL + "foo")'s priority is now 20.
```

### $child(key)

Creates a new `$firebase` object for a child referenced by the provided key.
This is only useful for some special cases and creates some overhead.
Generally, you should simply modify the child data directly on the parent
reference since that is already synchronized to the server.

``` js
var child = items.$child("foo");
// Same as calling items.$remove("foo"); use that instead
child.$remove();
```

Array Functions
---------------

### $asArray([$scope])

Returns a **READ ONLY ARRAY** which can be sorted, iterated,
and will be updated whenever the master data is changed. The contents are
controlled by $firebase, so changes should be made using `$`
methods (`$set`, `$add`, `$remove`) etc.

``` js
var items = $firebase(ref);

var list = items.$asArray();
angular.forEach(list, function(nextItem) {
    /* process items in order */
});
```

To add/remove/update items, call the `$add`/`$remove`/`$update` methods on
the `firebase` instance.

``` js
var list = items.$asArray();

var newData = {foo: 'bar'};
list.indexOf(newData); // -1

items.$add(newData);
list.indexOf(newData); // >= 0
```

Each call to $asArray() creates a new synchronized instance. For this reason, it should not be used
 directly from angular expressions (i.e. in the HTML), because this would create a new instance each
 time the Angular content is compiled (possibly hundreds of times per page).

This can be put directly into `$scope` for working with filters and directives. If `$scope`
is passed as an argument, then `$off()` is called automatically.

``` js
$scope.list = items.$asArray($scope);
```

``` html
<a ng-repeat="item in list | orderBy:sortField | filter:filterText"
   ng-click="list.$remove(item.$id)">
      {{item.name}}
</a>
```

### array.$indexOf(key)

    @param {string|number} key
    @returns {int} the index or -1 if not found

Returns the numeric array position of an item with the matching `$id` property.

``` js
// assume data [ "a": {foo: 'bar'}, "b": {hello: 'world'} ]
var list = items.$asArray();
list.$indexOf('b')   // returns 1
list.$indexOf('baz') // returns -1
```

### array.$add(data)

A convenience wrapper for [array.$firebase.$add](#add).

### array.$remove(key)

A convenience wrapper for [array.$firebase.$remove](#remove).

### array.$set(key, newValue)

A convenience wrapper for [array.$firebase.$set](#set).

### array.$update(key, updateHash)

A convenience wrapper for [array.$firebase.$update](#update).

### array.$move(key, newPriority)

A convenience wrapper for setting [$priority](#priority) on the child record.

```js
var list = $firebase(ref).$asArray();

list.$move('a', 100);

// same thing as...
list.$firebase['a'].$priority = 100;
list.$firebase.$save('a');
```

### array.$off()

Stop synchronizing to the server; turn of event listeners. Useful to call
this when the scope is destroyed (i.e. route changes in Angular) to reclaim
memory and cpu cycles.

This is automagically called if `$scope` is passed into the $asArray() constructor.

``` js
var list = $firebase(ref).$asArray();

// call this when the list is no longer useful
list.$off();
```

### array.$firebase

Convenience property to access the writable `$firebase` instance used to create this array.

``` js
var items = $firebase(ref);
var list = items.$asArray();

list.$firebase === items; // true!
```

### using array.sort()

By default, the array elements will be ordered to match the order of the
remote data (i.e. by `$priority` if it exists, and then by `$id`).
The `sort()` method works as expected, allowing us to override how our
local data will be ordered.

However, just like any other sorted array, elements added or updated
after sort may not appear in sorted order. So when changes arrive
from Firebase, sort would need to be called again:

``` js
// assume data [ "a": {count: 200}, "b": {count: 100}, "c": {count: 150} ]
var list = items.$asArray();
list.$indexOf('a'); // 0

function countComparator(a,b) {
   // sort by the count property
   return a.count === b.count? 0 : (a.count > b.count? 1 : -1);
}

list.sort(countComparator);
list.$indexOf('a'); // 2

// watch for server updates and maintain sorted ordering
list.$firebase.$on('change', function() {
   list.sort(countComparator);
});

// places record 'c' after 'b' on the server
list.$firebase.$child('c').$set({ 'count': 350 });
// but the $on('change') event resorts, so it is not incorrectly at position 2
list.$indexOf('c'); // 3
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
items.$on("loaded", function() {
  console.log("Initial data received!");
});
items.$on("change", function() {
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
items.$off('loaded');
// Stops synchronization on `items` completely.
function stopSync() {
  items.$off();
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
items.$bind($scope, "remoteItems");
$scope.remoteItems.bar = "foo";  // new Firebase(URL + "/bar") is now "foo".
```

This method returns a promise, which will be resolved when the initial data
from the server has been received. The promise will be resolved with an
`unbind` function, which, when called, will disassociate the 3-way binding.

``` js
items.$bind($scope, "remote").then(function(unbind) {
  unbind();
  $scope.remote.bar = "foo";    // No changes have been made to the remote data.
});
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

In order to use the `$firebaseSimpleLogin` service, you must first include the Firebase Simple Login
JS library (in addition to firebase.js) - more information about this library can be
[found here](https://www.firebase.com/docs/security/simple-login-overview.html).

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

The login object returned by `$firebaseSimpleLogin` contains several method and
a property named `user`. This property will be set to `null` if the user is
logged out and will change to an object containing the user's details once they are logged in.

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

### $createUser(email, password)

The `$createUser` method is useful if you are using the "password" provider from Firebase Simple Login
that allows you to manage your own set of user accounts where users authenticate with an email address and password.
This function creates a new user account with the specified email address and password. 

This function returns a promise that is resolved when the user account has been successfully created.

Note that this function only creates the user, if you wish to log in as the newly created user, call $login() 
after the promise for this method has been fulfilled.


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

Browser Compatability
---------------------
<table>
  <tr>
    <th>Browser</th>
    <th>Version Supported</th>
    <th>With Polyfill</th>
  </tr>
  <tr>
    <td>Internet Explorer</td>
    <td>9+</td>
    <td>6+</td>
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

To support IE8 and below, simply include polyfills for
[Array.prototype.forEach](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Polyfill),
[Array.prototype.indexOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill),
 and [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility) in your code base.

 Examine `test/lib/polyfills.js` for an example.
