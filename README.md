AngularFire
===========
AngularFire is an officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularFire).
Firebase is a full backend so you don't need servers to build your Angular app!

*Please visit [AngularFire.com](http://angularfire.com) for a
[tutorial](http://angularfire.com/tutorial),
[a quickstart guide](http://angularfire.com/quickstart.html),
[documentation](http://angularfire.com/documentation.html) and more!*

Join our [Firebase + Angular Google Group](https://groups.google.com/forum/#!forum/firebase-angular) to ask questions, provide feedback, and share apps you've built with Firebase and Angular.

Usage
-----
Include `firebase.js` and `angularfire.js` in your HTML:

```html
<script src="https://cdn.firebase.com/v0/firebase.js"></script>
<script src="https://cdn.firebase.com/libs/angularfire/0.5.0-rc1/angularfire.js"></script>
````

Define the `firebase` module as a dependency for your Angular app:

```js
var myApp = angular.module("MyApp", ["firebase"]);
```

Create an instance of the `$firebase` service by specifying it as a dependency
in your controller (or service) and passing it a Firebase reference. Queries
and limits may be applied to the reference:

```js
function MyController($scope, $firebase) {
  $scope.items = $firebase(new Firebase(URL));
}
```

All remote data will automatically be reflected in `$scope.items`. All
local changes to the data must be done via the following methods in order
to save them remotely:

`$scope.items.$add`: Append a new item onto the list (uses Firebase.push).
`$scope.items.$save`: Save the current state of the object to Firebase (uses Firebase.update).
`$scope.items.$set`: Overwrite the remote data with the current state of the object (uses Firebase.set).
`$scope.items.$remove`: Remove this object from Firebase.

If you'd like all local changes to be *immediately* synchronized with Firebase,
you have the option to create a true 3-way binding using `$bind`:

```js
function MyController($scope, $firebase) {
  var obj = $firebase(new Firebase(URL));
  obj.$bind($scope, "items");
}
```

Now, any changes made to `$scope.items` will be immediately synchronized.

You can listen to the following events using `$on`:

```js
function MyController($scope, $firebase) {
  var obj = $firebase(new Firebase(URL));
  obj.$on("loaded", function() {
    console.log("Initial data loaded");
  });
  obj.$on("changed", function() {
    console.log("Remote changes were applied to the local object");
  });
}
```

Development
-----------
[![Build Status](https://travis-ci.org/firebase/angularFire.png)](https://travis-ci.org/firebase/angularFire)

If you'd like to hack on AngularFire itself, you'll need
[node.js](http://nodejs.org/download/) and
[CasperJS](https://github.com/n1k0/casperjs):

```bash
brew install casperjs
npm install
```

Use grunt to build and test the code:

```bash
# Default task - validates with jshint, minifies source and then runs unit tests
grunt

# Watch for changes and run unit test after each change
grunt watch

# Run tests
grunt test

# Minify source
grunt build
```

License
-------
[MIT](http://firebase.mit-license.org).
