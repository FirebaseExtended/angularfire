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

Certain versions of AngularFire beta releases were tested against specific versions of
the supporting libraries. The following table documents the version requirements:

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
    <td>1.1.2</td>
  </tr>
  <tr>
    <td>0.6.0</td>
    <td>1.0.2</td>
    <td>1.2.3</td>
    <td>1.1.2</td>
  </tr>
  <tr>
    <td>0.7.0</td>
    <td>1.0.5</td>
    <td>1.2.5</td>
    <td>1.2</td>
  </tr>
  <tr>
    <td>0.7.1</td>
    <td>1.0.6</td>
    <td>1.3.0</td>
    <td>&gt;= 1.2, &lt; 1.3.0</td>
  </tr>
  <tr>
    <td>0.8.0</td>
    <td>1.0.15+</td>
    <td>1.3.0+</td>
    <td>1.2.18+</td>
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

### $asArray()

Returns a synchronized array. **This collection is READ-ONLY**. Clients should not use
push(), splice(), et al to modify the structure of the array. Multiple calls return the same
array instance, not unique copies. See [$FirebaseArray](#firebasearray)

```js
app.controller('myController', function($scope) {
  var sync = $firebase(ref);

  var list = sync.$asArray();
  list.$loaded().then(function() {
     console.log('list has ' + list.length + ' items');
  });

  // we can add it directly to $scope if we want to access this from the DOM
  $scope.list = list;
})
```

```html
<li ng-repeat="item in list">{{item|json}}</li>
```

### $asObject()

Returns a synchronized object. When data is updated on the server, the local copy will be altered
(but not replaced) to match. See [$FirebaseObject](#firebaseobject).

```js
app.controller('myController', function($scope) {
  var sync = $firebase(ref);

  var record = sync.$asObject();
  record.$loaded().then(function() {
     console.log('record has id', record.$id);
  });

  // we can add it directly to $scope if we want to access this from the DOM
  $scope.record = record;
})
```

```html
<p>{{record.$id}}: {{record.name}}</p>
```

### $ref()

Returns the Firebase ref used to create this instance.

```js
var ref = new Firebase(URL);
var sync = $firebase(ref);
sync.$ref() === ref; // true
```

### $push(data)

The `$push` method takes a single argument of any type. It will append this
value as a member of a list (ordered in chronological order). This is the
equivalent of calling `push(value)` on a Firebase reference.

``` js
sync.$push({foo: "bar"});
```

This method returns a promise that will be fulfilled when the data has
been added to the server. The promise will be resolved with a Firebase
reference, from which you can extract the key name of the newly added data.

``` js
sync.$push({baz: "boo"}).then(function(ref) {
  ref.name();   // Key for the newly created record
}/*, error handler */);
```

### $set([key, ]data)

The `$set` method takes one or two arguments. If a key is provided, it sets the value of a
child record to `data`. Otherwise, it replaces the entire $firebase path with the data provided.
 This is the equivalent of calling `set(value)` on a Firebase reference.

``` js
// set child foo to 'bar'
sync.$set('foo', "bar");

// replace all child keys with {foo: 'bar'}
sync.$set({foo: 'bar'});
```

This method returns a promise that will be fulfilled when the data has
been saved to the server. The promise will be resolved with a Firebase
reference for the saved record.

``` js
sync.$set('foo', "bar").then(function(ref) {
  ref.name();   // foo
}/*, error handler */);
```

### $remove([key])

The `$remove` method takes one or zero arguments. If a key is provided, it removes a
child record. Otherwise, it removes the entire $firebase path.
 This is the equivalent of calling `remove()` on a Firebase reference.

``` js
// remove child 'bar'
sync.$remove('bar');

// remove all children at this path
sync.$remove();
```

This method returns a promise that will be fulfilled when the data has
been removed from the server. The promise will be resolved with a Firebase
reference for the exterminated record.

``` js
sync.$remove('foo').then(function(ref) {
  ref.name();   // foo
}/*, error handler */);
```

### $update([key, ]data)

The `$update` method takes one or two arguments. If a key is provided, it updates the value of a
child record to `data`. Otherwise, it updates the entire $firebase path with the data provided.

This is the equivalent of calling `update(value)` on a Firebase reference. Any child keys specified
in `data` are completely replaced by the values provided (update only works one level deep into
child records, not recursively), and any child keys not in data are left alone.

``` js
// assume we have this data in Firebase: {foo: 1, bar: 2, baz: 3}
sync.$update({foo: 10, baz: 20});
// new data: {foo: 10, bar: 2, baz: 20}

// assume we have this data: {foo: 10, bar: {hello: 'world'}}
sync.$update('bar', {count: 20});
// new data: {foo: 10, bar: {hello: 'world', count: 20}}

sync.$update({ bar: {count: 21} }); // only 1 level deep!
// new data: {foo: 10, bar: {count: 21}} // hello key was deleted
```

This method returns a promise that will be fulfilled when the data has
been saved to the server. The promise will be resolved with a Firebase
reference for the updated record.

``` js
sync.$update('bar', {count: 20}).then(function(ref) {
  ref.name();   // bar
}/*, error handler */);
```

### $transaction(updateFn[, applyLocally])

Used to atomically modify data at the Firebase location. `$transaction` is used to modify the
existing value to a new value, ensuring there are no conflicts with other clients writing
to the same location at the same time. See [Firebase docs](https://www.firebase.com/docs/javascript/firebase/transaction.html)
for more details.

`$transaction` takes an `updateFn` argument which is a developer-supplied function
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
var messageCount = $firebase(new Firebase(URL + "/messageCount"));

// Increment the message count by 1
messageCount.$transaction(function(currentCount) {
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

By default, an instance of this Class is returned by `$firebase.$asObject()`.
It will automatically be kept in sync with the remote Firebase data. **Note that any 
changes to that object will *not* automatically result in any changes to the remote data**. 
All such changes will have to performed via one of the `$save`/`$set`/`$remove` methods 
on this object, or by utilizing `$bindTo` (see more below).

``` js
myapp.controller("MyController", ["$scope"', "$firebase",
  function($scope, $firebase) {
     var obj = $firebase(new Firebase(URL)).$asObject();

     // to take an action after the data loads, use $loaded() promise
     obj.$loaded().then(function() {
        console.log('loaded record', obj.$id, obj.someOtherKeyInData);
     });

     // To iterate the key/value pairs of the object, use `angular.forEach` 
     angular.forEach(obj, function(value, key) {
        console.log(key, value);
     });

     // To make the data available in the DOM, assign it to $scope
     $scope.data = obj;

     // For 3-way data bindings, bind it to the scope instead
     obj.$bindTo($scope, 'data');
  }
]);
```

### $id

The Firebase key where this record is stored. The same as `obj.$inst().$ref().name()`.

### $priority

The priority for this record according to the last update we received. Modifying this value
and then calling `$save()` will also update the server's priority.

### $value

If the value in Firebase is a primitive (boolean, string, or number) then the value will
be stored under this `$value` key. Modifying this value and then calling `$save` will also
update the server's value.

Note that any time this value exists, all other keys are ignored. To change a primitive to
an object, delete `$value` and add other keys to the data.

### $save()

If changes are made to data, then calling `$save` will push those changes to the server. This
method returns a promise that will resolve when the write is completed.

```js
var obj = $firebase(ref).$asObject();
obj.foo = 'bar';
obj.$save().then(function(ref) {
   ref.name() === obj.$id; // true
}/*, optional error callback */);
```

### $loaded()

Returns a promise which will resolve after initial value is retrieved from Firebase.

```js
var obj = $firebase(ref).$asObject();
obj.$loaded()
  .then(function(data) {
    console.log(data === obj); // true
  }/*, optional error handler */)
  .then(...)
  .catch(...)
  .final(...)
```

The resolve/reject methods can optionally be passed directly into `$loaded`:

```
var obj = $firebase(ref).$asObject();
obj
  .$loaded(
    function(data) {
     console.log(data === obj); // true
    },
    fuction(err) {
      console.error(err);
    }  
  )
```

### $inst()

Returns the $firebase instance used to create this object.

```js
var sync = $firebase(ref);
var obj = sync.$asObject();
obj.$inst() === sync; // true
```

### $bindTo(scope, varName)

Creates a three-way binding between a scope variable and Firebase data. When the `scope` data is
updated, changes are pushed to Firebase, and when changes occur in Firebase, they are pushed
instantly into `scope`.

This method returns a promise that resolves after the initial value is pulled from Firebase
and set in the `scope` variable.

```js
var ref = new Firebase(URL); // assume value here is {foo: 'bar'}
var obj = $firebase(ref).$asObject();

obj.$bindTo($scope, 'data').then(function() {
   console.log($scope.data); // {foo: 'bar'}
   $scope.data.foo = 'bar';  // will be saved to Firebase
   ref.$set({foo: 'baz'});   // $scope.data will soon be updated to {foo: 'baz'}
});
```

```html
<!-- This input field is 3-way synchronized to Firebase (changing value updates remote data; remote changes are applied here) -->
<input type="text" ng-model="data.foo" />
```

If `$destroy` is emitted by `scope` (this happens when a controller is destroyed), then this
object is automatically unbound from `scope`. It can also be manually unbound using the
off method, which is passed into the promise callback.

```js
var obj = $firebase(ref).$asObject();
obj.$bindTo($scope, 'data').then(function(off) {

   // unbind this later:
   //off()

});
```

### $destroy()

Calling this method cancels event listeners and frees memory used by data in this object.

$FirebaseArray
--------------

By default, `$firebase.$asArray()` returns an instance of this Class.
This is a **READ-ONLY ARRAY** suitable for use in directives
like `ng-repeat` and with filters (which expect an array). 
The array will automatically be kept in sync with remote changes.

This array should not be directly manipulated. Methods like splice(), push(), pop(), and unshift()
will cause the data to become out of sync with server. Instead, utilize the `$add`/`$save`/`$remove`
methods provided to change the structure of the array.

``` js
myapp.controller("MyController", ["$firebase",
  function($firebase) {
     var sync = $firebase(new Firebase(URL));
     var list = sync.$asArray();

     // add an item
     list.add({foo: 'bar'}).then(...);

     // remove an item
     list.remove(2);

     // make the list available in the DOM
     $scope.list = list;
  }
]);
```

``` html
<li ng-repeat="item in list | filter:name">{{item|json}}</li>
```

Note that, while the array itself should not be modified, it is practical to change
specific elements of the array and save them back to Firebase:

```js
// in JavaScript
var list = $firebase(new Firebase(URL)).$asArray();
list[2].foo = 'bar';
list.$save(2);
```

``` html
<!-- in the dom -->
<li ng-repeat="item in list">
  <input ng-model="item.foo" ng-change="list.save(item)" />
</li>
```

### $add(newData)

Creates a new record in Firebase and adds the record to our synchronized array.

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the ref for the newly added record, providing easy access to its key.

```js
var list = $firebase(ref).$asArray();
list.$add({foo: 'bar'}).then(function(ref) {
   var id = ref.name();
   console.log('added record with id ' + id);
   list.$indexFor(id); // returns location in the array
});
```

### $save(recordOrIndex)

The array itself cannot be modified, but records in the array can be updated and saved back
to Firebase individually. This method saves a modified local record back to Firebase. It
accepts either an array index or a reference to an item that exists in the array.

```js
   $scope.list = $firebase(ref).$asArray();
```
```html
<li ng-repeat="item in list">
   <input type="text" ng-model="item.title" ng-change="list.$save(item)" />
</li>
```

This method returns a promise which is resolved after data has been saved to the server.
The promise resolves to the ref for the saved record, providing easy access to its key.

```js
var list = $firebase(ref).$asArray();
list[2].foo = 'bar';
list.save(2).then(function(ref) {
   ref.name() === list[2].$id; //true
});
```

### $remove(recordOrIndex)

Remove a record from Firebase and from the local data. This method returns a promise that
resolves after the record is deleted at the server. It will contain a Firebase ref to
the deleted record. It accepts either an array index or a reference to an item that
exists in the array.

```js
var list = $firebase(ref).$asArray();
var item = list[2];
list.$remove(item).then(function(ref) {
   ref.name() === item.$id; // true
});
```

### $keyAt(recordOrIndex)

Returns the Firebase key for a record in the array. It accepts either an array index or
a reference to an item that exists in the array.

```js
// assume records 'alpha', 'bravo', and 'charlie'
var list = $firebase(ref).$asArray();
list.$keyAt(1); // bravo
list.$keyAt( list[1] ); // bravo
```

### $indexFor(key)

The inverse of `$keyAt`, this method takes a key and finds the associated record in the array.
If the record does not exist, -1 is returned.

```js
// assume records 'alpha', 'bravo', and 'charlie'
var list = $firebase(ref).$asArray();
list.$indexFor('alpha'); // 0
list.$indexFor('bravo'); // 1
list.$indexFor('zulu'); // -1
```

### $loaded()

Returns a promise which is resolved when the initial array data has been downloaded from Firebase.
The promise resolves to the array itself.

```js
var list = $firebase(ref).asArray();
list.$loaded()
  .then(function(x) {
    x === list; // true
  }/*, fail method */)
  .then(...)
  .catch(...)
  .final(...)
```

The resolve/reject methods may also be passed directly into $loaded:

```js
var list = $firebase(ref).asArray();
list.$loaded(
  function(x) {
    x === list; // true
  }, function(err) {
    console.error(err);
  });
```

### $inst()

Returns the `$firebase` instance used to create this array.

```js
var sync = $firebase(ref);
var list = sync.$asArray();
sync === list.$inst(); // true
```

### $watch(cb[, context])

Any callback passed here will be invoked each time data in the array is updated from the server.
The callback receives an object with the following keys:
 * `event`: child_added, child_moved, child_removed, or child_changed
 * `key`: The id of the record that triggered event
 * `prevChild`: If event is child_added or child_moved, this contains the prev record key or null (first record)

```js
var ref = new Firebase(URL);
var list = $firebase(ref).$asArray();

list.$watch(function(event) {
  console.log(event);
});

// logs {event: 'child_removed', key: 'foo'}
list.$remove('foo');

// logs {event: 'child_added', key: '<new id>', prevId: '<prev id>'}
list.$add({hello: 'world'});
```

A common use case for this would be to customize the sorting for a synchronized array. Since
each time an add or update arrives from the server, the data could become out of order, we
can resort on each event. We don't have to worry about excessive resorts slowing down Angular's
compile process, or creating excessive DOM updates, because the evens are already batched
nicely into a single $apply event (we gather them up and trigger the events in batches  before
telling $digest to dirty check).

```js
var list = $firebase(ref).$asArray();

// sort our list
list.sort(compare);

// each time the server sends records, resort
list.watch(function() { list.sort(compare); });

// custom sorting routine (sort by last name)
function compare(a, b) {
   return a.lastName.localeCompare(b.lastName);
}
```

### $destroy
Stop listening for events, free memory, and empty this array.


Transforming the Array/Object Factories
-------------------------------------

There are several powerful techniques for transforming the data downloaded and saved
by `$FirebaseArray` and `$FirebaseObject`. Since these are fully fledged services, with
a real prototype, they can be overridden or extended.

### The Sync Methods

Private methods on `$FirebaseObject` and on `$FirebaseArray`, prefixed with `$$`, are used
to process all of the server synchronizations and can be overridden:

**$FirebaseArray**

 - **$$added**: called with `snapshot` and `prevChild` each time a child_added event occurs
 - **$$updated**: called with `shapshot` each time a child_changed event occurs
 - **$$removed**: called with `snapshot` ecah time a child_removed event occurs
 - **$$moved**: called with `snapshot` and `prevChild` each time a child_moved event occurs
 - **$$error**: called with `error` message any time there is a security error in listeners (these
 are generally not recoverable errors)

**$FirebaseObject**

 - **$$updated**: called with `snapshot` any time a value event is received from Firebase
 - **$$error**: called if a security error occurs (these are generally not recoverable)

### Extending the Factories

The factories both provide a special `extendFactory` method which can be used to create
a copy with modified or added methods. For example, we could add a sum method to $FirebaseArray:

```
app.factory('ArrayWithSum', function($FirebaseArray) {
  return $FirebaseArray.extendFactory({
    sum: function() {
      var total = 0;
      angular.forEach(this._list, function(rec) {
         total += rec.x;
      });
      return total;
    }
  });  
})
```

We can then use this factory with any `$firebase` constructor:

```
var list = $firebase(ref, {arrayFactory: 'ArrayWithSum'}).asArray();
list.sum();
```

We can also pass in a class to inherit methods from either `$FirebaseArray` or
`$FirebaseObject`:

```
app.factory('SillyObject', function($FirebaseObject) {
  // FirebaseArray and FirebaseObject constructors both accept a $firebase
  // instance, and a method which they can call in order to destroy any listeners
  function SillyObject($firebase, destroyFunction) {
     // call the super constructor
     $FirebaseObject.call(this, $firebase, destroyFunction);
  }

  SillyObject.prototype.makeJoke = function() { 
    alert('Why did the chicken cross the road?'); 
  };

  // override the behavior of the $$updated method
  SillyObject.prototype.$$updated = function(snap) {
     this.$id = snap.name();
     this.foo = Math.random();
     this.data = snap.val();
  };

  // override how data is returned to the server
  SillyObject.prototype.toJSON = function() {
     return this.data;
  };

  return $FirebaseObject.extendFactory(Silly);
});
```

### Decorating the Factories

In general, it will be more useful to extend the factories to create new services.
However, it is also possible to modify `$FirebaseArray` or `$FirebaseObject` directly
by using Angular's `$decorate` method.

```
angular.config(function($provide) {
  $provide.decorator('$FirebaseObject', function($delegate, $firebaseUtils) {
    var _oldUpdate = $delegate.prototype.$$update;

    // override any instance of $FirebaseObject to look for a date field
    // and transforms it to a Date object.
    $delegate.prototype.$$update = function(snap) {
      var data = _oldUpdate.call(this, snap);
      if( data.hasOwnProperty('date') ) {
        data.date = new Date(data.date);
      }
    };

    // we also need to restore the value when we send it back to the server
    // so we can declare a toJSON method for this
    $delegate.prototype.toJSON = function() {
       var data = $firebaseUtils.toJSON(this);
       if( data.date ) {
         data.date = data.date.getTime();
       }
    };
  });
});
```

Creating AngularFire Services
-----------------------------

With the ability to extend the AngularFire factories, powerful services can be built with
a minimal amount of code. For example, we can create a "User" factory:

```
// create a User factory
app.factory('UserObject', function($FirebaseObject) {
  return $FirebaseObject.extendFactory({
      getFullName: function() {
         // concatenate first and last name
         return this.first_name + ' ' + this.last_name;
      }
   });
});
```

And pass it into `$firebase` to be used whenever $asObject() is called:
```
// create a User object from our Factory
app.factory('User', function($firebase, $FirebaseObject) {
  var ref = new Firebase(URL+'/users/');
  return function(userid) {
     return $firebase(ref.child(userid), {objectFactory: 'UserObject'}).asObject();
  }
});
```

Similarly, we can extend `$FirebaseArray` by creating a message object:

```
app.factory('Message', function($firebase, $FirebaseArray) {
  function Message(snap) {
     this.$id = snap.name();
     this.message = snap.val();
  }
  Message.prototype = {
    update: function(snap) {
      this.message = snap.val();
    },
    toJSON: function() {
      return this.message;
    }
  };

  return Message;
});
```

We can then use that to extend the `$FirebaseArray` factory:

```
app.factory('MessageFactory', function($FirebaseArray, Message) {
  return $FirebaseArray.extendFactory({
      // override the $$added behavior to return a Message object
      $$added: function(snap) {
        return new Message(snap);
      },

      // override the $$updated behavior to call a method on the Message
      $$updated: function(snap) {
        var i = this.$indexFor(snap.name());
        var msg = this._list[i];
        msg.update(snap);
      }
  });  
});
```

And finally, we can put it all together into a synchronized list of messages:

```
app.factory('MessageList', function($firebase, MessageFactory) {
  return function(ref) {
    return $firebase(ref, {arrayFactory: MessageFactory}).asArray();
  }
});
```

$firebaseSimpleLogin
--------------------

AngularFire includes support for user authentication via [Firebase Simple
Login](https://www.firebase.com/docs/security/simple-login-overview.html) with the
$firebaseSimpleLogin service. You'll need to include `firebase` as a dependency of your app's module
to use this service.

Note that Firebase also provides a low-level, extremely flexible authentication system called
[Custom Login](https://www.firebase.com/docs/security/custom-login.html) for developers with 
complex use cases. Simple Login is intended to handle the common use cases that most applications
encounter with a drop-in, hosted solution.

In order to use the `$firebaseSimpleLogin` service, you must first include the Firebase Simple 
Login JS library (in addition to firebase.js) - more information about this library can be
[found here](https://www.firebase.com/docs/security/simple-login-overview.html).

### Login Service Constructor

The `$firebaseSimpleLogin` factory takes a Firebase reference (not a $firebase object) as its only 
argument. Note that the login state for Simple Login is global to your application, even if multiple
$firebaseSimpleLogin objects are created.

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

The `$getCurrentUser` function returns a future that will be resolved with the user info for the
currently logged-in user. Note that the user info will be null if no user is logged in.


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

Note that the `login object` can be included in your scope, and the methods on it can be called 
directly from your HTML as shown:

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

The `$createUser` method is useful if you are using the "password" provider from Firebase Simple 
Login that allows you to manage your own set of user accounts where users authenticate with an 
email address and password. This function creates a new user account with the specified email 
address and password. 

This function returns a promise that is resolved when the user account has been successfully created.

Note that this function only creates the user, if you wish to log in as the newly created user, 
all $login() after the promise for this method has been fulfilled.


### $changePassword(email, oldPassword, newPassword)

The `$changePassword` function changes the password for the user account with the specified email 
address. This function returns a promise that is resolved when the password has been successfully 
changed on the Firebase servers.


### $removeUser(email, password)

The `$removeUser` function deletes the user account for the specified email address. This function 
returns a promise that is resolved when the user has been successfully removed on the Firebase 
servers.


### $sendPasswordResetEmail(email)

The `$sendPasswordResetEmail` function sends a password reset email to the specified email address, 
containing a new,temporary password that the user may use to log in and update their credentials.
This function returns a promise that is resolved when the email notification has been sent 
successfully.


### Login-related Events

The following events will be broadcast on `$rootScope` as a result of AngularFire login activity.

  * `$firebaseSimpleLogin:login`: Fired when a user successfully logs in. In addition
to the event object, the event callback will be passed one argument: the user object.
  * `$firebaseSimpleLogin:logout`: Fired when a user logs out. No arguments except the event object 
will be passed to the event callback.
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

Polyfills are automatically included to support older browsers. See src/polyfills.js for links
and details.