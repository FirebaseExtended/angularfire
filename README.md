angularFire
===========
angularFire is an [AngularJS](http://angularjs.org/) service that integrated
with [Firebase](http://www.firebase.com) so you can easily add real-time
features to your app!

The bindings let you associate a Firebase URL with a model (or set of models),
and they will be transparently kept in sync across all clients currently using
your app. The 2-way data binding offered by AngularJS works as normal, except
that the changes are also sent to all other clients instead of just a server.

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

Set `angularFire` as a service dependency in your controller:

```js
myapp.controller('MyCtrl', function MyCtrl($scope, angularFire, filterFilter) {
  ...
});
```

Bind a Firebase URL to any scope variable:

```js
var url = 'https://<my-firebase>.firebaseio.com/items';
$scope.items = angularFire(url, $scope, 'items');
```

Use the model in your markup as you normally would:

```js
<ul ng-controller="MyCtrl">
  <li ng-repeat="item in items">{{item.name}}: {{item.desc}}</li>
</ul>
```

To add or remove items, simply edit the model (a JavaScript array by default)
after the promise has completed:

```js
$scope.items.then(function() {
  // Add a new item. You can also add a function to $scope and call it
  // from markup as you normally would with AngularJS.
  $scope.items.push({name: "Firebase", desc: "is awesome!"});
});
```

See [todoCtrl.js](https://github.com/firebase/angularFire/blob/master/examples/todomvc/controllers/todoCtrl.js)
for a working example of how all this falls in place!

License
-------
[MIT](http://firebase.mit-license.org).
