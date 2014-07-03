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
<script src="https://cdn.firebase.com/js/client/1.0.17/firebase.js"></script>
<script src="https://cdn.firebase.com/libs/angularfire/0.8.0/angularfire.js"></script>
```

If you want to use any Simple Login related functionality, you'll need to include
the appropriate version of the Simple Login library as well.

``` html
<script src="https://cdn.firebase.com/js/simple-login/1.6.1/firebase-simple-login.js"></script>
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
  <tr>
    <td>0.8.0</td>
    <td>1.0.15+</td>
    <td>1.3.0+</td>
    <td>1.3+</td>
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

The `$firebase` wrapper is used for synchronizing Firebase data with Angular
apps. It contains some helper methods for writing data to Firebase, as well as tools for
reading data into synchronized collections or objects.

```js
myapp.controller("MyController", function($firebase) {
   var ref = new Firebase(URL);
   var sync = $firebase(ref);

   // if ref points to a data collection
   $scope.list = sync.asArray();

   // if ref points to a single record
   $scope.rec = sync.asObject();
});
```

```html
<!-- iterate asArray data -->
<li ng-repeat="item in list">{{item|json}}</li>

<!-- debug asObject data -->
{{rec.$data|json}}
```

### Constructor

The `$firebase` service takes a single argument: a Firebase reference. You
may apply queries and limits to sync a subset of your data.

```js
var ref = new Firebase(URL);
var sync = $firebase(ref);

// you can apply startAt/endAt/limit to your references
var limited = $firebase(ref.limit(10));
```

### asArray()

Returns a synchronized array. **This collection is READ-ONLY**. Clients should not use
push(), splice(), et al to modify the structure of the array. Multiple calls return the same
array instance, not unique copies. See [$FirebaseArray](#firebasearray)

```js
// use in a controller
var sync = $firebase(ref);
var list = sync.asArray();
list.loaded().then(function() {
   console.log('list has ' + list.length + ' items');
});

<!-- use in directive: $scope.sync = $firebase(ref)  -->
<li ng-repeat="item in sync.asArray()">{{item|json}}</li>
```

### asObject()

Returns a synchronized object. When data is updated on the server, the local copy will be altered
(but not replaced) to match. See [$FirebaseObject](#firebaseobject).

### ref()

Returns the Firebase ref used to create this instance.

```js
var ref = new Firebase(URL);
var sync = $firebase(ref);
sync.ref() === ref; // true
```

### push(data)

The `push` method takes a single argument of any type. It will append this
value as a member of a list (ordered in chronological order). This is the
equivalent of calling `push(value)` on a Firebase reference.

``` js
sync.push({foo: "bar"});
```

This method returns a promise that will be fulfilled when the data has
been added to the server. The promise will be resolved with a Firebase
reference, from which you can extract the key name of the newly added data.

``` js
sync.push({baz: "boo"}).then(function(ref) {
  ref.name();   // Key name of the added data.
}/*, error handler */);
```

### set([key, ]data)

The `set` method takes one or two arguments. If a key is provided, it sets the value of a
child record to `data`. Otherwise, it replaces the entire $firebase path with the data provided.
 This is the equivalent of calling `set(value)` on a Firebase reference.

``` js
// set child foo to 'bar'
sync.set('foo', "bar");

// replace all child keys with {foo: 'bar'}
sync.set({foo: 'bar'});
```

This method returns a promise that will be fulfilled when the data has
been saved to the server. The promise will be resolved with a Firebase
reference for the saved record.

``` js
sync.save('foo', "bar").then(function(ref) {
  ref.name();   // foo
}/*, error handler */);
```

### remove([key])

The `remove` method takes one or zero arguments. If a key is provided, it removes a
child record. Otherwise, it removes the entire $firebase path.
 This is the equivalent of calling `remove()` on a Firebase reference.

``` js
// remove child 'bar'
sync.remove('bar');

// remove all children at this path
sync.remove();
```

This method returns a promise that will be fulfilled when the data has
been removed from the server. The promise will be resolved with a Firebase
reference for the exterminated record.

``` js
sync.remove('foo').then(function(ref) {
  ref.name();   // foo
}/*, error handler */);
```

### update([key, ]data)

The `update` method takes one or two arguments. If a key is provided, it updates the value of a
child record to `data`. Otherwise, it updates the entire $firebase path with the data provided.

This is the equivalent of calling `update(value)` on a Firebase reference. Any child keys specified
in `data` are completely replaced by the values provided (update only works one level deep into
child records, not recursively), and any keys not in data are left alone.

``` js
// assume we have this data in Firebase: {foo: 1, bar: 2, baz: 3}
sync.update({foo: 10, baz: 20});
// new data: {foo: 10, bar: 2, baz: 20}

// assume we have this data: {foo: 10, bar: {hello: 'world'}}
sync.update('bar', {count: 20});
// new data in bar: {hello: 'world', count: 20}

sync.update({ bar: {count: 21} }); // only 1 level deep!
// new data: {foo: 10, bar: {count: 21}} // hello key was deleted
```

This method returns a promise that will be fulfilled when the data has
been saved to the server. The promise will be resolved with a Firebase
reference for the updated record.

``` js
sync.update('bar', {count: 20}).then(function(ref) {
  ref.name();   // bar
}/*, error handler */);
```

### transaction(updateFn[, applyLocally])

Used to atomically modify data at the Firebase location. $transaction is used to modify the
existing value to a new value, ensuring there are no conflicts with other clients writing
to the same location at the same time. See [Firebase docs](https://www.firebase.com/docs/javascript/firebase/transaction.html)
for more details.

$transaction takes an `updateFn` argument which is a developer-supplied function
that will be passed the current data stored at the location (as a JS object). The function should
return the new value it would like written (as a JS object). If `undefined` is returned, the transaction
will be aborted and the data at the location will not be modified. Keep in mind that this method
may be called multiple times until the client and server agree on a final value.

By default, events are immediately raised when the update function runs. So if the client and server
disagree on the final state, you may see intermediate values at the client. You can set the
`applyLocally` argument to false to suppress these intermediate states, which makes the UI less
 responsive but avoids any temporary blinking of an intermediate value.

This method returns a promise which will resolve to null if the transaction is aborted, otherwise
it resolves with the snapshot of the new data at the location.

``` js
$scope.messageCount = $firebase(new Firebase(URL + "/messageCount"));

// Increment the message count by 1
$scope.messageCount.transaction(function(currentCount) {
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

$FirebaseObject
---------------

The object returned by `$firebase.asObject()` will automatically be kept in sync with
the remote Firebase data. **Note that any changes to that object will *not*
automatically result in any changes to the remote data**. All such changes will
have to performed via one of the save/set/remove methods on this object, or by
utilizing bindTo (see more below).

The actual server data is synced into the `$data` key.

``` js
myapp.controller("MyController", ["$scope", "$firebase",
  function($scope, $firebase) {
     var obj = $firebase(new Firebase(URL)).asObject();

     // to take an action after the data loads, use loaded() promise
     obj.loaded().then(function() {
        console.log('loaded record ' + obj.$id);
     });

     // To iterate the key/value pairs of the object, use `angular.forEach` or `obj.forEach`
     obj.forEach(function(value, key) {
        console.log(key, value);
     });

     // To make the data available in the DOM, add it to $scope
     $scope.data = obj.$data;

     // For 3-way data bindings, bind it to the scope instead
     obj.bindTo($scope, 'data');
  }
]);
```

### $data

Stores the data downloaded from Firebase. When future updates arrive from the server, they will
update this variable and trigger a compile operation in angular (triggering it to update the DOM
elements). This $data object will always be an object. If the server value is a primitive, it
will be stored in $data['.value']. If the server value is null, the `$data` key will contain an
empty object with no keys.

### $id

The Firebase key where this record is stored. The same as obj.inst().ref().name().

### $priority

The priority for this record according to the last update we received. Modifying this value
and then calling save() will also update the server's priority.

### save()

If changes are made to $data, then calling save() will push those changes to the server. This
method returns a promise that will resolve when the save op is completed.

```js
var obj = $firebase(ref).asObject();
obj.$data = {foo: 'bar'};
obj.save().then(function(ref) {
   ref.name() === obj.$id; // true
}/*, optional error callback */);
```

### loaded()

Returns a promise which will resolve after initial value is retrieved from Firebase.

```js
var obj = $firebase(ref).asObject();
obj.loaded().then(function(data) {
   console.log(data === obj); // true
}/*, optional error handler */);
```

### inst()

Returns the $firebase instance used to create this object.

```js
var sync = $firebase(ref);
var obj = sync.asObject();
obj.inst() === sync; // true
```

### bindTo(scope, varName)

Creates a three-way binding between a scope variable and Firebase data. When the $scope data is
updated, changes are pushed to Firebase, and when changes occur in Firebase, they are pushed
instantly into $scope.

The bind method returns a promise that resolves after the initial value is pulled from Firebase
and set in the $scope variable.

```js
var ref = new Firebase(URL); // assume value here is {foo: 'bar'}
var obj = $firebase(ref).asObject();
obj.bindTo($scope, 'data').then(function() {
   console.log($scope.data); // {foo: 'bar'}
   ref.set({foo: 'baz'}); // $scope.data will soon be updated to {foo: 'baz'}
});
```

```html
<!-- changes here automagically pushed to foo -->
<input type="text" ng-model="data.foo" />
```

If `$destroy` is emitted by $scope (this happens when a controller is destroyed), then the scope
variable is automatically unbound from this object. It can also be manually unbound using the
off method provided in the promise callback.

```js
var obj = $firebase(ref).asObject();
obj.bindTo($scope, 'data').then(function(off) {
   // unbind this later by calling off()
});
```

### destroy()

Calling this method cancels event listeners and frees memory used by data in this object.

### toJSON()

Returns a JSON formatted object suitable for pushing data into Firebase.

### forEach(iterator[, context])

Iterates the key/value pairs of `$data`, assuming it is an object, and invokes iterator
for each entry, passing key, value, object. If context is provided, it will be set to `this`
scope inside iterator callbacks.

$FirebaseArray
--------------

Calling `$firebase.asArray()` will generate a **READ-ONLY ARRAY** suitable for use in directives
like `ng-repeat` and with filters (which expect an array). The array will automatically be kept
in sync with remote changes.

This array should not be directly manipulated. Methods like splice(), push(), pop(), and unshift()
will cause the data to become out of sync with server. Instead, utilize the methods provided to
make changes to the data records in the array.

``` js
myapp.controller("MyController", ["$firebase",
  function($firebase) {
     var sync = $firebase(new Firebase(URL));
     $scope.list = sync.asArray();

     // add an item
     $scope.list.add({foo: 'bar'}).then(...);

     // remove an item
     $scope.list.remove(2);
  }
]);
```

``` html
<li ng-repeat="item in list | filter:name">{{item|json}}</li>
```

### add(newData)

Creates a new record in Firebase and adds the record to our synchronized array.

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the ref for the newly added record, providing easy access to its key.

```js
var list = $firebase(ref).asArray();
list.add({foo: 'bar'}).then(function(ref) {
   console.log('added ' + ref.name());
});
```

### save(recordOrIndex)

The array itself cannot be modified, but records in the array can be updated and saved back
to Firebase individually. This method saves a modified local record back to Firebase. It
accepts either an array index or a reference to an item that exists in the array.

```js
   $scope.list = $firebase(ref).asArray();
```
```html
<li ng-repeat="item in list">
   <input type="text" ng-model="item.title" ng-change="list.save(item)" />
</li>
```

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the ref for the saved record, providing easy access to its key.

```js
var list = $firebase(ref).asArray();
list[2].foo = 'bar';
list.save(2).then(function(ref) {
   ref.name() === list[2].$id; //true
});
```

### remove(recordOrIndex)

Remove a record from Firebase and from the local data. This method returns a promise that
resolves after the record is deleted at the server. It will contain a Firebase ref to
the deleted record. It accepts either an array index or a reference to an item that
exists in the array.

```js
var list = $firebase(ref).asArray();
var item = list[2];
list.remove(item).then(function(ref) {
   ref.name() === item.$id; // true
});
```

### keyAt(recordOrIndex)

Returns the Firebase key for a record in the array. It accepts either an array index or
a reference to an item that exists in the array.

```js
// assume records 'alpha', 'bravo', and 'charlie'
var list = $firebase(ref).asArray();
list.keyAt(1); // bravo
list.keyAt( list[1] ); // bravo
```

### indexFor(key)

The inverse of keyAt, this method takes a key and finds the associated record in the array.
If the record does not exist, -1 is returned.

```js
// assume records 'alpha', 'bravo', and 'charlie'
var list = $firebase(ref).asArray();
list.indexFor('alpha'); // 0
list.indexFor('bravo'); // 1
list.indexFor('zulu'); // -1
```

### loaded()

Returns a promise which is resolved when the initial array data has been downloaded from Firebase.
The promise resolves to the array itself.

```js
var list = $firebase(ref).asArray();
list.loaded().then(function(x) {
   x === list; // true
}/*, fail method */);
```

### inst()

Returns the $firebase instance used to create this array.

```js
var sync = $firebase(ref);
var list = sync.asArray();
sync === list.inst(); // true
```

### watch(cb[, context])

Any callback passed into the watch method will be invoked each time data in the array is updated
by the server. Events can be batched, so each time the callback is invoked, it receives an array.
Each element of the array is an object with the following keys:
 * event: child_added, child_moved, child_removed, or child_changed
 * key: Firebase key of the record that triggered event
 * prevChild: If event is child_added or child_moved, this contains the prev record key or null (first record)

```js
var ref = new Firebase(URL);
var list = $firebase(ref).asArray();
list.watch(function(events) {
   angular.forEach(events, function(event) {
      console.log(event);
   });
});

// logs {event: 'child_removed', key: 'foo'}
ref.remove('foo');
// logs {event: 'child_added', key: 'newrecord', prevId: 'foo'}
ref.child('newrecord').set({hello: 'world'});
```

A common use case for this would be to customize the sorting for a synchronized array. Since
each time an add or update arrives from the server, the data could become out of order, we
can resort on each update event. We don't have to worry about excessive resorts here since
events are already batched nicely.

```js
var list = $firebase(ref).asArray();
// sort our list
list.sort(compare);
// each time the server sends records, resort
list.watch(function() { list.sort(compare); });

// custom sorting routine (sort by last name)
function compare(a, b) {
   return a.lastName.localeCompare(b.lastName);
}
```

### destroy
Stop listening for events, free memory, and empty this array.

$FirebaseRecordFactory
----------------------

This static class provides transform functions for converting server data to local objects
and vice versa. Normally, it's not necessary to access this object. It's
used internally by $firebase to create and manipulate the records stored in the asArray()'s
collection.

However, this class can easily be decorated, or a custom factory can be specified to create
 services and handle more complex use cases.

### Decorating the record factory to transform data

You can decorate $firebaseRecordFactory like any other service:

```js
app.config(function($provide) {
   $provide.decorator('$firebaseRecordFactory', function($delegate) {
      // override the toJSON method to add a last_update timestamp to each record
      var _tojson = $delegate.toJSON;
      $delegate.toJSON = function(record) {
         var data = _tojson(record);
         data.last_update = Firebase.ServerValue.TIMESTAMP;
         return data;
      };
      return $delegate;
   });
});
```

### Creating your own record factories

It's also possible to specify another factory to use, as long as the service implements the
required methods. For example, it would be possible for asArray() to return a list of Person
objects, instead of simple json objects.

We could implement this by writing our own factory as follows:

```js
angular.factory('myRecordFactory', function(Person) {
   return {
      create: function(snap) { return new Person(snap); },
      update: function(person, snap) { return person.update(snap); },
      toJSON: function(person) { return person.toJSON(); },
      getKey: function(person) { return person.getKey(); },
      destroy: function(person) { return person.destroy(); },
      getPriority: function(person) { return person.getPriority(); }
   };
});

// then later we can sync our collection like this
var list = $firebase(ref, {recordFactory: "myRecordFactory"}).asArray();

list.loaded().then(function() {
   console.log(list[0] instanceof Person); // true!
});
```

### create(snapshot)
Called whenever a new `child_added` event is received from the server, receives the snapshot
of the child record and must return an object that should be added into the collection.

### update(record, snapshot)
Called whenever a new `child_updated` event is received from the server. This should update
key/value pairs in the existing record and then return the updated object. If this returns
a new object, it will replace the existing data.

$firebaseRecordFactory simply deletes old keys and adds new keys to the data. If the value is
a primitive, it's stored in `.value`

### toJSON(record)
Called before returning a record to the server, this method should transform the local record
into a suitable JSON object that can be saved to Firebase.

### getKey(record)
Must return the Firebase key that is used to store a record. $firebaseRecordFactory stores
 the key in in `$id` on each record in the collection.

### destroy(record)
Called when a record is removed at the server (child_removed) or when destroy() is called
on $FirebaseArray instance. The default implementation doesn't do anything, but this allows
proprietary services a chance to clean up listeners and free memory before being disposed.

### getPriority(record)
Must return the Firebase priority for each record. If the value is non-null, $firebaseRecordFactory
stores this value in `.priority` on each record. If a collection does not use priorities, this
method could simply return null.

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

Polyfills are automatically included to support older browsers. See src/polyfills.js for links
and details.
