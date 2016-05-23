# AngularFire Quickstart

AngularFire is the officially supported AngularJS binding for Firebase. The combination of Angular and Firebase provides a three-way data binding between your HTML, your JavaScript, and the Firebase database.

## 1. Create an Account
The first thing we need to do is [sign
up for a free Firebase account](https://firebase.google.com/). A brand new Firebase app will automatically be created with its own unique URL ending in ```firebaseio.com```. We'll use this URL
to authenticate users and store and sync data with [AngularFire](https://github.com/firebase/angularfire).

## 2. Add Script Dependencies

In order to use AngularFire in a project, include the following script tags:

```html
<!-- AngularJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/3.0.0/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
```

*Firebase and AngularFire are available via npm and Bower as ```firebase``` and ```angularfire```, respectively. A Yeoman generator is also available.*

## 3. Inject the AngularFire Services

Before we can use AngularFire with dependency injection, we need to register `firebase` as a module in our application.

```js
var app = angular.module("sampleApp", ["firebase"]);
```

Now the `$firebaseObject`, `$firebaseArray`, and `$firebaseAuth` services are available to be injected into any controller, service, or factory.

```js
app.controller("SampleCtrl", function($scope, $firebaseObject) {
  var ref = firebase.database().ref();
  // download the data into a local object
  $scope.data = $firebaseObject(ref);
  // putting a console.log here won't work, see below
});
```
In the example above, `$scope.data` is going to be populated from the remote server. This is an asynchronous call, so it will take some time before the data becomes available in the controller. While it might be tempting to put a `console.log` on the next line to read the results, the data won't be downloaded yet, so the object will appear to be empty. Read the section on [Asynchronous Operations](guide/intro-to-angularfire.html#section-async-intro) for more details.

## 4. Add Three-Way, Object Bindings

Angular is known for its two-way data binding between JavaScript models and the DOM, and Firebase has a lightning-fast, realtime database. For synchronizing simple key / value pairs, AngularFire can be used to *glue* the two together, creating a "three-way data binding" which automatically synchronizes any changes to your DOM, your JavaScript, and the Firebase database.

To set up this three-way data binding, we use the `$firebaseObject` service introduced above to create a synchronized object, and then call `$bindTo()`, which binds it to a `$scope` variable.

```js
var app = angular.module("sampleApp", ["firebase"]);
app.controller("SampleCtrl", function($scope, $firebaseObject) {
  var ref = firebase.database().ref().child("data");
  // download the data into a local object
  var syncObject = $firebaseObject(ref);
  // synchronize the object with a three-way data binding
  // click on `index.html` above to see it used in the DOM!
  syncObject.$bindTo($scope, "data");
});
```

```html
<html ng-app="sampleApp">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
    <script src="https://cdn.firebase.com/js/client/2.2.4/firebase.js"></script>
    <script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
    <script src="app.js"></script>
  </head>
  <body ng-controller="SampleCtrl">
    <!-- anything typed in here is magically saved to our Firebase database! -->
    <input type="text" ng-model="data.text"/>
    <!-- all changes from our Firebase database magically appear here! -->
    <h1>You said: {{ data.text }}</h1>
  </body>
</html>
```

## 5. Synchronize Collections as Arrays
Three-way data bindings are amazing for simple key / value data. However, there are many times when an array would be more practical, such as when managing a collection of messages. This is done using the `$firebaseArray` service.

We synchronize a list of messages into a read-only array by using the `$firebaseArray` service and then assigning the array to `$scope`:

```js
var app = angular.module("sampleApp", ["firebase"]);
app.controller("SampleCtrl", function($scope, $firebaseArray) {
  var ref = firebase.database().ref().child("messages");
  // create a synchronized array
  // click on `index.html` above to see it used in the DOM!
  $scope.messages = $firebaseArray(ref);
});
```

```html
<html ng-app="sampleApp">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
    <script src="https://cdn.firebase.com/js/client/2.2.4/firebase.js"></script>
    <script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
    <script src="app.js"></script>
  </head>
  <body ng-controller="SampleCtrl">
    <ul>
      <li ng-repeat="message in messages">{{ message.text }}</li>
    </ul>
  </body>
</html>
```

Because the array is synchronized with server data and being modified concurrently by the client, it is possible to lose track of the fluid array indices and corrupt the data by manipulating the wrong records. Therefore, the placement of items in the list should never be modified directly by using array methods like `push()` or `splice()`.

Instead, AngularFire provides a set of methods compatible with manipulating synchronized arrays: `$add()`, `$save()`, and `$remove()`.

```js
var app = angular.module("sampleApp", ["firebase"]);
app.controller("SampleCtrl", function($scope, $firebaseArray) {
  var ref = firebase.database().ref().child("messages");
  // create a synchronized array
  $scope.messages = $firebaseArray(ref);
  // add new items to the array
  // the message is automatically added to our Firebase database!
  $scope.addMessage = function() {
    $scope.messages.$add({
      text: $scope.newMessageText
    });
  };
  // click on `index.html` above to see $remove() and $save() in action
});
```

```html
<html ng-app="sampleApp">
  <head>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.15/angular.min.js"></script>
    <script src="https://cdn.firebase.com/js/client/2.2.4/firebase.js"></script>
    <script src="https://cdn.firebase.com/libs/angularfire/2.0.0/angularfire.min.js"></script>
  </head>
  <body ng-controller="SampleCtrl">
    <ul>
      <li ng-repeat="message in messages">
        <!-- edit a message -->
        <input ng-model="message.text" ng-change="messages.$save(message)" />
        <!-- delete a message -->
        <button ng-click="messages.$remove(message)">Delete Message</button>
      </li>
    </ul>
    <!-- push a new message onto the array -->
    <form ng-submit="addMessage()">
      <input ng-model="newMessageText" />
      <button type="submit">Add Message</button>
    </form>
  </body>
</html>
```

## 6. Add Authentication
Firebase provides a [hosted authentication service](https://firebase.google.com/docs/database/security/) which offers a completely client-side solution to account management and authentication. It supports anonymous authentication, email / password login, and login via several OAuth providers, including Facebook, GitHub, Google, and Twitter.

AngularFire provides a service named `$firebaseAuth` which wraps the authentication methods provided by the Firebase client library. It can be injected into any controller, service, or factory.

```js
app.controller("SampleCtrl", function($scope, $firebaseAuth) {
  var ref = firebase.database().ref();
  // create an instance of the authentication service
  var auth = $firebaseAuth(ref);
  // login with Facebook
  auth.$authWithOAuthPopup("facebook").then(function(authData) {
    console.log("Logged in as:", authData.uid);
  }).catch(function(error) {
    console.log("Authentication failed:", error);
  });
});
```

## 7. Next Steps
This was just a quick run through of the basics of AngularFire. For a more in-depth explanation of how to use the library as well as a handful of live code examples, [continue reading the AngularFire Guide](guide/).

To deploy your Angular applications free, fast, and without fuss, do it Firebase style! Check out [Firebase Hosting](https://firebase.google.com/docs/hosting/) for more information.
