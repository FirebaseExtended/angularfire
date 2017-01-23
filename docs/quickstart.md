# Quickstart | AngularFire

AngularFire is the officially supported AngularJS binding for Firebase. The combination of Angular
and Firebase provides a three-way data binding between your HTML, your JavaScript, and the Firebase
database.


## 1. Create an Account
The first thing we need to do is [sign up for a free Firebase account](https://firebase.google.com/).
A brand new Firebase project will automatically be created for you which you will use in conjunction
with AngularFire to authenticate users and store and sync data.


## 2. Add Script Dependencies

In order to use AngularFire in a project, include the following script tags:

```html
<!-- Angular -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.1/angular.min.js"></script>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/3.6.6/firebase.js"></script>

<!-- AngularFire -->
<script src="https://cdn.firebase.com/libs/angularfire/2.3.0/angularfire.min.js"></script>
```

Firebase and AngularFire are also available via npm and Bower as `firebase` and `angularfire`,
respectively. A [Yeoman generator](https://github.com/firebase/generator-angularfire) is also
available.


## 3. Initialize the Firebase SDK

We'll need to initialize the Firebase SDK before we can use it. You can find more details on the
[web](https://firebase.google.com/docs/web/setup) or
[Node](https://firebase.google.com/docs/server/setup) setup guides.

```js
<script>
  // Initialize the Firebase SDK
  var config = {
    apiKey: '<your-api-key>',
    authDomain: '<your-auth-domain>',
    databaseURL: '<your-database-url>',
    storageBucket: '<your-storage-bucket>'
  };
  firebase.initializeApp(config);
</script>
```


## 4. Inject the AngularFire Services

Before we can use AngularFire with dependency injection, we need to register `firebase` as a module
in our application.

```js
var app = angular.module("sampleApp", ["firebase"]);
```

Now the `$firebaseObject`, `$firebaseArray`, and `$firebaseAuth` services are available to be
injected into any controller, service, or factory.

```js
app.controller("SampleCtrl", function($scope, $firebaseObject) {
  var ref = firebase.database().ref();
  // download the data into a local object
  $scope.data = $firebaseObject(ref);
  // putting a console.log here won't work, see below
});
```

In the example above, `$scope.data` is going to be populated from the remote server. This is an
asynchronous call, so it will take some time before the data becomes available in the controller.
While it might be tempting to put a `console.log` on the next line to read the results, the data
won't be downloaded yet, so the object will appear to be empty. Read the section on
[Asynchronous Operations](guide/introduction-to-angularfire.md#handling-asynchronous-operations) for more details.


## 5. Add Three-Way, Object Bindings

Angular is known for its two-way data binding between JavaScript models and the DOM, and Firebase
has a lightning-fast, realtime database. For synchronizing simple key / value pairs, AngularFire can
be used to *glue* the two together, creating a "three-way data binding" which automatically
synchronizes any changes to your DOM, your JavaScript, and the Firebase database.

To set up this three-way data binding, we use the `$firebaseObject` service introduced above to
create a synchronized object, and then call `$bindTo()`, which binds it to a `$scope` variable.

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
  <body ng-controller="SampleCtrl">
    <!-- anything typed in here is magically saved to our Firebase database! -->
    <input type="text" ng-model="data.text"/>
    <!-- all changes from our Firebase database magically appear here! -->
    <h1>You said: {{ data.text }}</h1>
  </body>
</html>
```


## 6. Synchronize Collections as Arrays

Three-way data bindings are amazing for simple key / value data. However, there are many times when
an array would be more practical, such as when managing a collection of messages. This is done using
the `$firebaseArray` service.

We synchronize a list of messages into a read-only array by using the `$firebaseArray` service and
then assigning the array to `$scope`:

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
  <body ng-controller="SampleCtrl">
    <ul>
      <li ng-repeat="message in messages">{{ message.text }}</li>
    </ul>
  </body>
</html>
```

Because the array is synchronized with server data and being modified concurrently by the client, it
is possible to lose track of the fluid array indices and corrupt the data by manipulating the wrong
records. Therefore, the placement of items in the list should never be modified directly by using
array methods like `push()` or `splice()`.

Instead, AngularFire provides a set of methods compatible with manipulating synchronized arrays:
`$add()`, `$save()`, and `$remove()`.

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


## 7. Add Authentication

Firebase provides a [hosted authentication service](https://firebase.google.com/docs/auth/) which
offers a completely client-side solution to account management and authentication. It supports
anonymous authentication, email / password login, and login via several OAuth providers, including
Facebook, GitHub, Google, and Twitter.

AngularFire provides a service named `$firebaseAuth` which wraps the authentication methods provided
by the Firebase client library. It can be injected into any controller, service, or factory.

```js
app.controller("SampleCtrl", function($scope, $firebaseAuth) {
  var auth = $firebaseAuth();

  // login with Facebook
  auth.$signInWithPopup("facebook").then(function(firebaseUser) {
    console.log("Signed in as:", firebaseUser.uid);
  }).catch(function(error) {
    console.log("Authentication failed:", error);
  });
});
```


## 8. Next Steps

This was just a quick run through of the basics of AngularFire. For a more in-depth explanation of
how to use the library as well as a handful of live code examples, [continue reading the AngularFire
Guide](guide/README.md).

To deploy your Angular applications free, fast, and without fuss, do it Firebase style! Check out
[Firebase Hosting](https://firebase.google.com/docs/hosting/) for more information.
