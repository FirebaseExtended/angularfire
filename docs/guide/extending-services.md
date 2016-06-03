# Extending Services | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [Naming Conventions](#naming-conventions)
* [Extending `$firebaseObject`](#extending-firebaseobject)
* [Extending `$firebaseArray`](#extending-firebasearray)


## Overview

**This section is intended for experienced Angular users. [Skip ahead](beyond-angularfire.md) if you are just getting started.**

Both the `$firebaseArray` and `$firebaseObject` services provide an
`$extend()` method for creating new services that inherit from these base classes.
This allows us to transform data and add additional methods onto our synchronized objects and
arrays. Before we jump into how exactly to do this, let's discuss some naming conventions used
within the AngularFire library.


## Naming Conventions

Methods in `$firebaseArray` and `$firebaseObject` are named using
`$`, `$$` or `_` prefixes, according to the following
convention:

* `$ prefix`: These are **public** methods that exist as part of the
AngularFire API. They can be overridden using `$extend()`. They should not be removed and must obey the contract specified in the API, as they are used internally by other methods.
* `$$ prefix`: The methods beginning with `$$` should be considered
**protected**. They are called by the synchronization code and should not be
called by other methods, but they may be useful to developers for manipulating data during
add / update / remove events. They can be overridden with `$extend()`
but must obey the contract specified in the API.
* `_ prefix`: Methods and properties beginning with `_` should be considered
**private**. They are internal methods to the AngularFire code and should not
be altered or depended on in any way. They can change or disappear in any future release,
without notice. They are ignored when converting local records to JSON before saving them to the
Firebase database.
* `$id`: This special variable is used to track the remote Firebase key. It's used by the
`$getRecord()` method to find items inside of `$firebaseArray` and is expected to be
set when `$$added` is invoked.
* `$value`: This special variable stores primitive values for remote records. For example, if the
remote value at a path is `"foo"`, and that path is synchronized into a local `$firebaseObject`,
the locally synchronized object will have a JSON structure `{ "$value": "foo" }`. Similarly, if a
remote path does not exist, the local object would have the JSON structure `{ "$value": null }`.
See [Working with Primitives](./synchronized-objects.md#working-with-primitives) for more details.

By default, data stored on a synchronized object or a record in a synchronized array exists
as a direct attribute of the object. We denote any methods or data which should *not* be
synchronized with the server by prefixing it with one of these characters. They are automatically
removed from JSON data before synchronizing this data back to the database.
Developers may use those prefixes to add additional data / methods to an object or a record
which they do not want synchronized.


## Extending `$firebaseObject`

The following `User` factory retrieves a synchronized user object, and
adds a special `getFullName()` method.

```js
app.factory("User", ["$firebaseObject",
  function($firebaseObject) {
    // create a new service based on $firebaseObject
    var User = $firebaseObject.$extend({
      // these methods exist on the prototype, so we can access the data using `this`
      getFullName: function() {
        return this.firstName + " " + this.lastName;
      }
    });

    return function(userId) {
      var userRef = firebase.database().ref()
        .child("users").child(userId);

      // create an instance of User (the new operator is required)
      return new User(userRef);
    }
  }
]);
```

The `new` operator is required for child classes created with the `$extend()` method.

The following special `$$` methods are used by the `$firebaseObject` service
to notify itself of any server changes. They can be overridden to transform how data is stored
locally, and what is returned to the server. Read more about them in the
[API documentation](/docs/reference.md#extending-the-services).

| Method | Description |
|--------|-------------|
| `$$updated(snapshot)` | Called with a snapshot any time the value in the database changes. It returns a boolean indicating whether any changes were applied. |
| `$$error(Object)` | Called if there is a permissions error accessing remote data. Generally these errors are unrecoverable (the data will no longer by synchronized). |
| `$$defaults(Object)` | A key / value pair that can be used to create default values for any fields which are not found in the server data (i.e. `undefined` fields). By default, they are applied each time the `$$updated` method is invoked. |
| `toJSON()` | If this method exists, it is used by `JSON.stringify()` to parse the data sent back to the server. |

If you view a `$firebaseObject` in the JavaScript debugger, you may notice a special `$$conf`
variable. This internal property is used to track internal bindings and state. It is non-enumerable (i.e. it won't
be iterated by `for` or by `angular.forEach()`) and is also read-only. It is never
saved back to the server (all `$$` properties are ignored), and it should not be modified or used
by extending services.


## Extending `$firebaseArray`

The following `ListWithTotal` service extends `$firebaseArray` to include a `getTotal()` method.

```js
app.factory("ListWithTotal", ["$firebaseArray",
  function($firebaseArray) {
    // create a new service based on $firebaseArray
    var ListWithTotal = $firebaseArray.$extend({
      getTotal: function() {
        var total = 0;
        // the array data is located in this.$list
        angular.forEach(this.$list, function(rec) {
          total += rec.amount;
        });
        return total;
      }
    });

    return function(listRef) {
      // create an instance of ListWithTotal (the new operator is required)
      return new ListWithTotal(listRef);
    }
  }
]);
```

The `new` operator is required for child classes created with the `$extend()` method.

The following special `$$` methods are called internally whenever AngularFire receives a notification
of a server-side change. They can be overridden to transform how data is stored
locally, and what is returned to the server. Read more about them in the
[API documentation](/docs/reference.md#extending-the-services).

| Method | Description |
|--------|-------------|
| `$$added(snapshot, prevChildKey)` | Called any time a `child_added` event is received. Returns the new record that should be added to the array. The `$getRecord()` method depends on $$added to set the special `$id` variable on each record to the Firebase key. This is used for finding records in the list during `$$added`, `$$updated`, and `$$deleted` events. It is possible to use fields other than `$id` by also overriding how `$getRecord()` matches keys to record in the array. |
| `$$updated(snapshot)` | Called any time a `child_updated` event is received. Applies the changes and returns `true` if any local data was modified. Uses the `$getRecord()` method to find the correct record in the array for applying updates. Should return `false` if no changes occurred or if the record does not exist in the array. |
| `$$moved(snapshot, prevChildKey)` | Called any time a `child_moved` event is received. Returns `true` if the record should be moved. The actual move event takes place inside the `$$process` method. |
| `$$removed(snapshot)` | Called with a snapshot any time a `child_removed` event is received. Depends on the `$getRecord()` method to find the correct record in the array. Returns `true` if the record should be removed. The actual splicing of the array takes place in the `$$process` method. The only responsibility of `$$removed` is deciding if the remove request is valid and if the record exists. |
| `$$error(errorObject)` | Called if there is a permissions error accessing remote data. Generally these errors are unrecoverable (the data will no longer by synchronized). |

The methods below are also part of extensible portion of `$firebaseArray`, and are used by the event
methods above, and when saving data back to the Firebase database.

| Method | Description |
|--------|-------------|
| `$$defaults(Object)` | A key / value pair that can be used to create default values for any fields which are not found in the server data (i.e. `undefined` fields). By default, they are applied each time the `$add()`, `$$added()`, or `$$updated()`, methods are invoked. |
| `toJSON()` | If this method exists on a record **in the array**, it is used to parse the data sent back to the server. Thus, by overriding `$$added` to create a toJSON() method on individual records, one can manipulate what data is sent back to Firebase and how it is processed before saving. |
| `$$process(event, record, prevChildKey)` | This is a mostly internal method and should generally not be overridden. It abstracts some common functionality between the various event types. It's responsible for all inserts, deletes, and splicing of the array element elements, and for calling `$$notify` to trigger notification events. It is called immediately after any server event (`$$added`, `$$updated`, `$$moved` or `$$removed`), assuming those methods do not cancel the event by returning `false` or `null`. |
| `$$notify(event, recordKey)` | This is a mostly internal method and should generally not be overridden. It triggers notification events for listeners established by `$watch` and is called internally by `$$process`. |

You can read more about extending the `$firebaseObject` and `$firebaseArray`
services in the
[API reference](/docs/reference.md#extending-the-services).

The sections of this guide so far have taken us on a tour through the functionality provided by the AngularFire library, but there is still more that can be done with the combination of Firebase and Angular. The [next section](beyond-angularfire.md) takes us beyond AngularFire to see what else is possible.
