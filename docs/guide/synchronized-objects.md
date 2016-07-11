# Synchronized Objects | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [API Summary](#api-summary)
* [Meta Fields on the Object](#meta-fields-on-the-object)
* [Full Example](#full-example)
* [Three-way Data Bindings](#three-way-data-bindings)
* [Working With Primitives](#working-with-primitives)


## Overview

Objects are useful for storing key / value pairs and singular records that are not used as a
collection. Consider the following user profile for `physicsmarie`:

```js
{
  "profiles": {
     "physicsmarie": {
        name: "Marie Curie",
        dob: "November 7, 1867"
     }
  }
}
```

We could fetch this profile using AngularFire's `$firebaseObject()` service. In addition to several
helper methods prefixed with `$`, the returned object would contain all of the child keys for that
record (i.e. `name` and `dob`).

```js
// define our app and dependencies (remember to include firebase!)
var app = angular.module("sampleApp", ["firebase"]);
// inject $firebaseObject into our controller
app.controller("ProfileCtrl", ["$scope", "$firebaseObject",
  function($scope, $firebaseObject) {
    var ref = firebase.database().ref();
    // download physicsmarie's profile data into a local object
    // all server changes are applied in realtime
    $scope.profile = $firebaseObject(ref.child('profiles').child('physicsmarie'));
  }
]);
```

The data will be requested from the server and, when it returns, AngularFire will notify the Angular
compiler to render the new content. So we can use this in our views normally. For example, the code
below would print the content of the profile in JSON format.

```html
<pre>{{ profile | json }}</pre>
```

Changes can be saved back to the server using the
[`$save()`](/docs/reference.md#save) method.
This could, for example, be attached to an event in the DOM view, such as `ng-click` or `ng-change`.

```html
<input ng-model="profile.name" ng-change="profile.$save()" type="text" />
```


## API Summary

The synchronized object is created with several special $ properties, all of which are listed in the following table:

| Method  | Description |
| ------------- | ------------- |
| [`$save()`](/docs/reference.md#save) |	Synchronizes local changes back to the remote database. |
| [`$remove()`](/docs/reference.md#remove)	| Removes the object from the database, deletes the local object's keys, and sets the local object's `$value` to `null`. It's important to note that the object still exists locally, it is simply empty and we are now treating it as a primitive with a value of `null`. |
| [`$loaded()`](/docs/reference.md#loaded) |	Returns a promise which is resolved when the initial server data has been downloaded. |
| [`$bindTo()`](/docs/reference.md#bindtoscope-varname) |	Creates a three-way data binding. Covered below in the [Three-way Data Bindings](#three-way-data-bindings) section. |


## Meta Fields on the Object

The synchronized object is created with several special `$` properties, all of which are listed in the following table:

| Method  | Description |
| ------------- | ------------- |
| [`$id`](/docs/reference.md#id) |	The key for this record. This is equivalent to this object's path in our database as it would be returned by `ref.key()`. |
| [`$priority`](/docs/reference.md#priority) |	The priority of each child node is stored here for reference. Changing this value and then calling `$save()` on the record will also change the object's priority on the server. |
| [`$value`](/docs/reference.md#value) |	If the data in our database is a primitive (number, string, or boolean), the `$firebaseObject()` service will still return an object. The primitive value will be stored under `$value` and can be changed and saved like any other child node. See [Working with Primitives](#working-with-primitives) for more details. |


## Full Example

Putting all of that together, we can generate a page for editing user profiles:

```js
var app = angular.module("sampleApp", ["firebase"]);

// a factory to create a re-usable profile object
// we pass in a username and get back their synchronized data
app.factory("Profile", ["$firebaseObject",
  function($firebaseObject) {
    return function(username) {
      // create a reference to the database node where we will store our data
      var ref = firebase.database().ref("rooms").push();
      var profileRef = ref.child(username);

      // return it as a synchronized object
      return $firebaseObject(profileRef);
    }
  }
]);

app.controller("ProfileCtrl", ["$scope", "Profile",
  function($scope, Profile) {
    // put our profile in the scope for use in DOM
    $scope.profile = Profile("physicsmarie");

    // calling $save() on the synchronized object syncs all data back to our database
    $scope.saveProfile = function() {
      $scope.profile.$save().then(function() {
        alert('Profile saved!');
      }).catch(function(error) {
        alert('Error!');
      });
    };
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="ProfileCtrl">
  <!-- $id is a special meta variable containing the object's key in our Firebase database.
  In this case, it would be "physicsmarie" -->
  <h3>Edit {{ profile.$id }}</h3>

  <!-- we can edit the $firebaseObject instance just like any other JS object -->
  <form ng-submit="saveProfile()">
    <label>Name:</label>
    <input type="text" ng-model="profile.name">

    <label>Email:</label>
    <input type="text" ng-model="profile.email">

    <button type="submit">Save Changes</button>
  </form>
</div>
```


## Three-way Data Bindings

Synchronizing changes from the server is pretty magical. However, shouldn't an awesome tool like
AngularFire have some way to detect local changes as well so we don't have to call `$save()`? Of
course. We call this a *three-way data binding*.

Simply call `$bindTo()` on a synchronized object and now any changes in the DOM are pushed to
Angular, and then automatically to our database. And inversely, any changes on the server get pushed
into Angular and straight to the DOM.

Let's revise our previous example to get rid of the pesky save button and the `$save()` method:

```js
var app = angular.module("sampleApp", ["firebase"]);

// a factory to create a re-usable Profile object
// we pass in a username and get back their synchronized data as an object
app.factory("Profile", ["$firebaseObject",
  function($firebaseObject) {
    return function(username) {
      // create a reference to the database node where we will store our data
      var ref = firebase.database().ref("rooms").push();
      var profileRef = ref.child(username);

      // return it as a synchronized object
      return $firebaseObject(profileRef);
    }
  }
]);

app.controller("ProfileCtrl", ["$scope", "Profile",
  function($scope, Profile) {
    // create a three-way binding to our Profile as $scope.profile
    Profile("physicsmarie").$bindTo($scope, "profile");
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="ProfileCtrl">
  <!-- $id is a special meta variable containing the object's key in our Firebase database.
  In this case, it would be "physicsmarie" -->
  <h3>Edit {{ profile.$id }}</h3>

  <label>Name:</label>
  <!-- this input field synchronizes directly to the name attribute in our Firebase database! -->
  <input type="text" ng-model="profile.name">

  <label>Email:</label>
  <!-- and this input field synchronizes directly to the email attribute in our Firebase database! -->
  <input type="text" ng-model="profile.email">
</div>
```

In this example, we've used `$bindTo()` to automatically synchronize data between the database and
`$scope.profile`. We don't need an `ng-submit` to call `$save()` anymore. AngularFire takes care of
all this automatically!

**While three-way data bindings can be extremely convenient, be careful of trying to use them
against deeply nested tree structures. For performance reasons, stick to practical uses like
synchronizing key / value pairs that aren't changed simultaneously by several users. Do not try to
use `$bindTo()` to synchronize collections or lists of data.**


## Working With Primitives

Consider the following data structure in Firebase:

```js
{
  "foo": "bar"
}
```

If we attempt to synchronize `foo/` into a `$firebaseObject`, the special `$value` key is created to
store the primitive. This key only exists when the path contains no child nodes. For a path that
doesn't exist, `$value` would be set to `null`.

```js
var ref = firebase.database().ref().child("push");
var obj = new $firebaseObject(ref);
obj.$loaded().then(function() {
  console.log(obj.$value); // "bar"
});

// change the value at path foo/ to "baz"
obj.$value = "baz";
obj.$save();

// delete the value and see what is returned
obj.$remove().then(function() {
  console.log(obj.$value); // null!
});
```

Head on over to the [API reference](/docs/reference.md#firebaseobject)
for `$firebaseObject` to see more details for each API method provided by the service. But not all
of your data is going to fit nicely into a plain JavaScript object. Many times you will have lists
of data instead. In those cases, you should use AngularFire's `$firebaseArray` service, which we
will discuss in the [next section](synchronized-arrays.md).
