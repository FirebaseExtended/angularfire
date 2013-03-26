angularFire
===========
angularFire is an [AngularJS](http://angularjs.org/) service that integrated
with [Firebase](http://www.firebase.com) so you can easily add real-time
features to your app!

The bindings let you associate a Firebase URL with a model (or set of models),
and they will be transparently kept in sync across all clients currently using
your app. The 2-way data binding offered by AngularJS works as normal, except
that the changes are also sent to all other clients instead of just a server.

### Live Demo: <a target="_blank" href="http://firebase.github.com/angularFire/examples/chat/">Simple chat room</a>.
### Live Demo: <a target="_blank" href="http://firebase.github.com/angularFire/examples/todomvc/">Real-time TODO app</a>.

Usage
-----
Include both firebase.js and angularFire.js in your application.

```html
<script src="https://cdn.firebase.com/v0/firebase.js"></script>
<script src="angularFire.js"></script>
```

Add the module `firebase` as a dependency for your app module:

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
myapp.controller('MyCtrl', function MyCtrl($scope, angularFire) {
  ...
});
```

Bind a Firebase URL to any model in `$scope`:

```js
var url = 'https://<my-firebase>.firebaseio.com/items';
$scope.items = angularFire(url, $scope, 'items');
```

Use the model in your markup as you normally would:

```html
<ul ng-controller="MyCtrl">
  <li ng-repeat="item in items">{{item.name}}: {{item.desc}}</li>
</ul>
```

To add or remove items, simply edit the model (a JavaScript array by default)
after the promise has completed:

```js
$scope.items.then(function() {
  // Add a new item by simply modifying the array.
  $scope.items.push({name: "Firebase", desc: "is awesome!"});
});
```

See the source for the
[controller behind the demo TODO app](https://github.com/firebase/angularFire/blob/gh-pages/examples/todomvc/js/controllers/todoCtrl.js)
for a working example of this pattern.

Option 2: Expicit synchronization
---------------------------------
This is method is great if you want control over when local changes are
synchronized to Firebase. Any changes made to a model won't be synchronized
automatically, and you must invoke specific methods if you wish to update the
remote data. All remote changes will automatically appear in the local model
(1-way synchronization).

Set `angularFireCollection` as a service dependency in your controller:

```js
myapp.controller:('MyCtrl', function MyCtrl($scope, angularFireCollection) {
  ...
});
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
<form ng-submit="items.$add(item)">
  <input type="text" ng-model="item.name" placeholder="Name" required/>
  <input type="text" ng-model="item.desc" placeholder="Description"/>
</form>
```

You can do the same with the `$remove` and `$update` methods.

See the source for the
[controller behind the demo chat app](https://github.com/firebase/angularFire/blob/gh-pages/examples/chat/app.js)
for a working example of this pattern.

License
-------
[MIT](http://firebase.mit-license.org).
