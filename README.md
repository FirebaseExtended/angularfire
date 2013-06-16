AngularFire
===========
AngularFire is an officially supported [AngularJS](http://angularjs.org/) binding
for [Firebase](http://www.firebase.com/?utm_medium=web&utm_source=angularFire).
Firebase is a full backend so you don't need servers to build your Angular app!

The bindings let you associate a Firebase URL with a model (or set of models),
and they will be transparently kept in sync across all clients currently using
your app. The 2-way data binding offered by AngularJS works as normal, except
that the changes are also sent to all other clients instead of just a server.

### Live Demo: <a target="_blank" href="http://firebase.github.com/angularFire/examples/chat/">Simple chat room</a>.
### Live Demo: <a target="_blank" href="http://firebase.github.com/angularFire/examples/todomvc/">Real-time TODO app</a>.

[![Build Status](https://travis-ci.org/firebase/angularFire.png)](https://travis-ci.org/firebase/angularFire)

Usage
-----
Include both firebase.js and angularFire.js in your application.

```html
<script src="https://cdn.firebase.com/v0/firebase.js"></script>
<script src="angularFire.js"></script>
```

Add the module `firebase` as a dependency to your app module:

```js
var myapp = angular.module('myapp', ['firebase']);
```

You now have two options.

Option 1: Implicit synchronization
----------------------------------
This method is great if you want to implicitly synchronize a model with Firebase.
All local changes will be automatically sent to Firebase, and all remote changes
will instantly update the local model.

Set `angularFire` as a service dependency in your controller:

```js
myapp.controller('MyCtrl', ['$scope', 'angularFire',
  function MyCtrl($scope, angularFire) {
    ...
  }
]);
```

Bind a Firebase URL to any model in `$scope`. The fourth argument is the type
of model you want to use (can be any JavaScript type, you mostly want a
dictionary or array):

```js
var url = 'https://<my-firebase>.firebaseio.com/items';
var promise = angularFire(url, $scope, 'items', []);
```

Use the model in your markup as you normally would:

```html
<ul ng-controller="MyCtrl">
  <li ng-repeat="item in items">{{item.name}}: {{item.desc}}</li>
</ul>
```

Data from Firebase is loaded asynchronously, so make sure you edit the model
*only after the promise has been fulfilled*. You can do this using the `then`
method (See the
[Angular documentation on $q](http://docs.angularjs.org/api/ng.$q)
for more on how promises work).

Place all your logic that will manipulate the model like this:

```js
promise.then(function() {
  // Add a new item by simply modifying the model directly.
  $scope.items.push({name: "Firebase", desc: "is awesome!"});
  // Or, attach a function to $scope that will let a directive in markup manipulate the model.
  $scope.removeItem = function() {
    $scope.items.splice($scope.toRemove, 1);
    $scope.toRemove = null;
  };
});
```

See the source for the
[controller behind the demo TODO app](https://github.com/firebase/angularFire/blob/gh-pages/examples/todomvc/js/controllers/todoCtrl.js)
for a working example of this pattern.

Option 2: Explicit synchronization
---------------------------------- 
This method is great if you want control over when local changes are
synchronized to Firebase. Any changes made to a model won't be synchronized
automatically, and you must invoke specific methods if you wish to update the
remote data. All remote changes will automatically appear in the local model
(1-way synchronization).

Set `angularFireCollection` as a service dependency in your controller:

```js
myapp.controller('MyCtrl', ['$scope', 'angularFireCollection',
  function MyCtrl($scope, angularFireCollection) {
    ...
  }
]);
```

Create a collection at a specified Firebase URL and assign it to a model in `$scope`:

```js
$scope.items = angularFireCollection(url);
```

Use the model as you normally would in your markup:

```html
<ul ng-controller="MyCtrl">
  <li ng-repeat="item in items">{{item.name}}: {{item.desc}}</li>
</ul>
```

You can bind specific functions if you wish to add, remove or update objects in
the collection with any Angular directive:

```html
<form ng-submit="items.add(item)">
  <input type="text" ng-model="item.name" placeholder="Name" required/>
  <input type="text" ng-model="item.desc" placeholder="Description"/>
</form>
```

You can do the same with the `remove` and `update` methods.

See the source for the
[controller behind the demo chat app](https://github.com/firebase/angularFire/blob/gh-pages/examples/chat/app.js)
for a working example of this pattern.

Development
-----------
If you'd like to hack on AngularFire itself, you'll need
[UglifyJS](https://github.com/mishoo/UglifyJS2) and
[CasperJS](https://github.com/n1k0/casperjs):

```bash
npm install uglifyjs -g
brew install casperjs
```

A Makefile is included for your convenience:

```bash
# Run tests
make test
# Minify source
make minify
```

License
-------
[MIT](http://firebase.mit-license.org).
