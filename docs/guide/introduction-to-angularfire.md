# Introduction to Firebase | AngularFire Guide

## Table of Contents

* [Overview](#overview)
* [The Role of AngularFire](#the-role-of-angularfire)
* [Installing AngularFire](#installing-angularfire)
* [Handling Asynchronous Operations](#handling-asynchronous-operations)


## Overview

Firebase provides several key advantages for [Angular](https://angular.io/) applications:

1. **Lightning-fast data synchronization:** Firebase can serve as your entire backend service, not
   only persisting your data, but synchronizing it instantly between millions of connected clients.
2. **No backend server:** Utilizing only the Firebase JavaScript SDK and AngularFire, combined with
   our [flexible Security Rules](https://firebase.google.com/docs/database/security/) rules, you can
   have complete control of your data without any server-side hardware or code.
3. **Built-in authentication:** Firebase provides an [authentication and user management
   service](https://firebase.google.com/docs/auth/) which interfaces with OAuth service
   providers like Facebook and Twitter, as well as anonymous and email / password authentication
   tools. You can even integrate with an existing authentication service using Firebase custom
   authentication.
4. **Free hosting:** Every Firebase app comes with [free hosting](https://firebase.google.com/docs/hosting/)
   served over a secure SSL connection and backed by a global CDN. You can deploy your static HTML,
   JavaScript, and CSS files to the web in seconds.
5. **Magical data bindings:** Our AngularFire library works like *glue* between Angular's two-way
   bindings and Firebase's scalable synchronization platform.


## The Role of AngularFire

AngularFire is an [open source library](https://github.com/firebase/angularfire) maintained by the
Firebase team and our amazing community of developers. It provides three-way communication between
your Firebase database and Angular's DOM - JavaScript bindings.

If you are unfamiliar with Firebase, we suggest you start by reading through the [Firebase web
guide](https://firebase.google.com/docs/database/web/start). It is important to understand the
fundamental principles of how to structure data in your Firebase database and how to read and write
from it before diving into AngularFire. These bindings are meant to complement the core Firebase
client library, not replace it entirely by adding `$` signs in front of the methods.

AngularFire is also not ideal for synchronizing deeply nested collections inside of collections. In
general, deeply nested collections [should typically be avoided](https://firebase.google.com/docs/database/web/structure-data)
in distributed systems.

While AngularFire abstracts a lot of complexities involved in synchronizing data, it is not required
to use Angular with Firebase. Alternatives are covered in the [Beyond AngularFire](./beyond-angularfire.md)
section of this guide.


## Installing AngularFire

Adding Firebase to your application is easy. Simply include the Firebase JavaScript SDK and the
AngularFire bindings from our CDN:

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

Once we have our libraries installed, we can include the AngularFire services by declaring
`firebase` as a module dependency in our application.

```js
var app = angular.module("sampleApp", ["firebase"]);
```

We now will have access to three services provided by AngularFire: `$firebaseObject`,
`$firebaseArray`, and `$firebaseAuth`. To use these services, we need to inject them into a
controller, factory, or service.

```js
app.controller("SampleController", ["$scope", "$firebaseArray",
  function($scope, $firebaseArray) {
    // ...
  }
]);
```

Let's see it in action! The live code example below is a working demo of a rudimentary chat room.
It binds an Angular view to a Firebase backend, synchronizing a list of messages between the DOM,
Angular, and Firebase in realtime. It doesn't seem like much code for all of this, and that's part
of the magic!

```js
// define our app and dependencies (remember to include firebase!)
var app = angular.module("sampleApp", ["firebase"]);

// this factory returns a synchronized array of chat messages
app.factory("chatMessages", ["$firebaseArray",
  function($firebaseArray) {
    // create a reference to the database location where we will store our data
    var ref = firebase.database().ref();

    // this uses AngularFire to create the synchronized array
    return $firebaseArray(ref);
  }
]);

app.controller("ChatCtrl", ["$scope", "chatMessages",
  // we pass our new chatMessages factory into the controller
  function($scope, chatMessages) {
    $scope.user = "Guest " + Math.round(Math.random() * 100);

    // we add chatMessages array to the scope to be used in our ng-repeat
    $scope.messages = chatMessages;

    // a method to create new messages; called by ng-submit
    $scope.addMessage = function() {
      // calling $add on a synchronized array is like Array.push(),
      // except that it saves the changes to our database!
      $scope.messages.$add({
        from: $scope.user,
        content: $scope.message
      });

      // reset the message input
      $scope.message = "";
    };

    // if the messages are empty, add something for fun!
    $scope.messages.$loaded(function() {
      if ($scope.messages.length === 0) {
        $scope.messages.$add({
          from: "Firebase Docs",
          content: "Hello world!"
        });
      }
    });
  }
]);
```

```html
<div ng-app="sampleApp" ng-controller="ChatCtrl">
  <ul class="chatbox">
    <li ng-repeat="message in messages">{{ message.from }}: {{ message.content }}</li>
  </ul>
  <form ng-submit="addMessage()">
    <input type="text" ng-model="message">
    <input type="submit" value="Add Message">
  </form>
</div>
```

The primary purpose of AngularFire is to manage synchronized data, which is exposed through the
`$firebaseObject` and `$firebaseArray` services. These services are aware of how Angular's
[compile process works](https://docs.angularjs.org/guide/compiler), and notifies it at the correct
points to check `$digest` for changes and update the DOM. If that sounds like a foreign language,
that's okay! AngularFire is taking care of it, so don't worry.

It's not always necessary to set up AngularFire bindings to interact with the database. This is
particularly true when just writing data, and not synchronizing it locally. Since you already have
a database reference handy, it is perfectly acceptable to simply use the vanilla Firebase client
library API methods.

```js
var ref = firebase.database().ref();
// We don't always need AngularFire!
//var obj = $firebaseObject(ref);
// For example, if we just want to increment a counter, which we aren't displaying locally,
// we can just set it using the SDK
ref.child("foo/counter").transaction(function(currentValue) {
  return (currentValue || 0) + 1;
});
```


## Handling Asynchronous Operations

Data is synchronized with our database *asynchronously*. This means that calls to the remote server
take some time to execute, but the code keeps running in the meantime. Thus, we have to be careful
to wait for the server to return data before we can access it.

The easiest way to log the data is to print it within the view using Angular's `json` filter.
AngularFire tells the Angular compiler when it has finished loading the data, so there is no need to
worry about when it be available.

```html
<pre>{{ data | json }}</pre>
```

It's also possible to do this directly in the controller by using the
[`$loaded()`](/docs/reference.md#loaded) method.
However, this method should be used with care as it's only called once after initial load. Using it
for anything but debugging is usually a poor practice.

```js
var ref = firebase.database().ref();
$scope.data = $firebaseObject(ref);
// this waits for the data to load and then logs the output. Therefore,
// data from the server will now appear in the logged output. Use this with care!
$scope.data.$loaded()
  .then(function() {
    console.log($scope.data);
  })
  .catch(function(err) {
    console.error(err);
  });
```

When working directly with the SDK, it's important to notify Angular's compiler after the data has
been loaded:

```js
var ref = firebase.database().ref();
ref.on("value", function(snapshot) {
  // This isn't going to show up in the DOM immediately, because
  // Angular does not know we have changed this in memory.
  // $scope.data = snapshot.val();
  // To fix this, we can use $scope.$apply() to notify Angular that a change occurred.
  $scope.$apply(function() {
    $scope.data = snapshot.val();
  });
});
```

Now that we understand the basics of integrating AngularFire into our application, let's dive deeper
into reading and writing synchronized data with our database. The
[next section](synchronized-objects.md) introduces the `$firebaseObject` service for creating
synchronized objects.
